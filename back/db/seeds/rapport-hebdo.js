import 'dotenv/config';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import 'dayjs/locale/fr.js';
import pool from '../dbManager.js';
import { logSeed } from './helpers/logSeed.js';

dayjs.extend(isoWeek);
dayjs.locale('fr');

// --- Parsing argument --semaine=YYYY-Www (ex: 2026-W14) ---
// Supporte : npm run seed:rapport-hebdo --semaine=2026-W14
//        ou : npm run seed:rapport-hebdo -- --semaine=2026-W14
const semaineArg =
    process.argv.slice(2).find(a => a.startsWith('--semaine='))?.split('=')[1]
    ?? process.env.npm_config_semaine
    ?? null;

let semaineDebut;
if (semaineArg) {
    const m = semaineArg.match(/^(\d{4})-W(\d{2})$/);
    if (!m) {
        console.error(`Format invalide : "${semaineArg}". Format attendu : YYYY-Www (ex: 2026-W14)`);
        process.exit(1);
    }
    semaineDebut = dayjs().year(parseInt(m[1])).isoWeek(parseInt(m[2])).startOf('isoWeek');
} else {
    semaineDebut = dayjs().subtract(1, 'week').startOf('isoWeek');
}

const semaineFin = semaineDebut.endOf('isoWeek');
const debutStr = semaineDebut.format('YYYY-MM-DD');
const finStr = semaineFin.format('YYYY-MM-DD');
const semaineLabel = `semaine du ${semaineDebut.format('D MMMM')} au ${semaineFin.format('D MMMM YYYY')}`;

console.log(`Génération du rapport hebdo pour la ${semaineLabel}...`);

// --- Collecte des données ---

const fetchScrutins = async () => {
    const { rows } = await pool.query(
        `SELECT s.uid, s.numero, s.titre, s.sort,
            s.nb_pour, s.nb_contre, s.nb_abstentions, s.nb_votants,
            COALESCE(c2.nom, c1.nom) AS categorie_nom
        FROM scrutins s
        LEFT JOIN scrutin_categories c1 ON c1.id = s.scrutin_categorie_id
        LEFT JOIN scrutin_sous_categories sc ON sc.id = s.scrutin_sous_categorie_id
        LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
        WHERE s.date_scrutin BETWEEN $1 AND $2
        ORDER BY s.numero DESC`,
        [debutStr, finStr]
    );
    return rows;
};

const fetchQags = async () => {
    const { rows } = await pool.query(
        `SELECT q.uid, q.sujet, q.rubrique, q.groupe_abrev, q.groupe_developpe,
            q.min_abrege, q.min_developpe,
            a.prenom AS auteur_prenom, a.nom AS auteur_nom,
            COALESCE(c2.nom, c1.nom) AS categorie_nom
        FROM qags q
        LEFT JOIN acteurs a ON a.id = q.acteur_ref
        LEFT JOIN scrutin_categories c1 ON c1.id = q.qag_categorie_id
        LEFT JOIN scrutin_sous_categories sc ON sc.id = q.qag_sous_categorie_id
        LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
        WHERE q.date_seance BETWEEN $1 AND $2
          AND q.code_cloture = 'REP_PUB'
        ORDER BY q.numero DESC`,
        [debutStr, finStr]
    );
    return rows;
};

const fetchAmendements = async () => {
    const { rows } = await pool.query(
        `SELECT am.uid, am.numero_long, am.article_titre, am.expose_sommaire, am.sort,
            COALESCE(c2.nom, c1.nom) AS categorie_nom,
            a.prenom AS auteur_prenom, a.nom AS auteur_nom
        FROM amendements am
        LEFT JOIN acteurs a ON a.id = am.auteur_ref
        LEFT JOIN scrutin_categories c1 ON c1.id = am.amendement_categorie_id
        LEFT JOIN scrutin_sous_categories sc ON sc.id = am.amendement_sous_categorie_id
        LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
        WHERE am.date_depot BETWEEN $1 AND $2
          AND am.sort IN ('Adopté', 'Rejeté')
        ORDER BY am.date_depot DESC
        LIMIT 100`,
        [debutStr, finStr]
    );
    return rows;
};

// --- Appel OpenAI ---

const genererRapport = async (scrutins, qags, amendements) => {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY manquant dans .env');

    const scrutinsText = scrutins.length > 0
        ? scrutins.map(s =>
            `• [${s.uid}] Scrutin n°${s.numero} — "${s.titre}" | Résultat : ${s.sort} | Pour : ${s.nb_pour}, Contre : ${s.nb_contre}, Abstentions : ${s.nb_abstentions} | Catégorie : ${s.categorie_nom || 'N/A'}`
        ).join('\n')
        : 'Aucun scrutin cette semaine.';

    // Regrouper les QaGs par catégorie pour synthèse
    const qagsParCategorie = {};
    for (const q of qags) {
        const cat = q.categorie_nom || q.rubrique || 'Autre';
        if (!qagsParCategorie[cat]) qagsParCategorie[cat] = [];
        qagsParCategorie[cat].push(`"${q.sujet}" (par ${q.auteur_prenom} ${q.auteur_nom}, ${q.groupe_abrev || 'NI'}, adressée à ${q.min_abrege || 'un ministre'})`);
    }
    const qagsText = Object.entries(qagsParCategorie).length > 0
        ? Object.entries(qagsParCategorie)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 8)
            .map(([cat, items]) => `${cat} (${items.length} question${items.length > 1 ? 's' : ''}) :\n  ${items.slice(0, 3).join('\n  ')}${items.length > 3 ? `\n  ...et ${items.length - 3} autres` : ''}`)
            .join('\n\n')
        : 'Aucune question au gouvernement cette semaine.';

    const amendementsText = amendements.length > 0
        ? amendements.slice(0, 30).map(a =>
            `• [${a.uid}] ${a.numero_long || a.uid} — "${a.article_titre || 'Sans titre'}" | Sort : ${a.sort} | Catégorie : ${a.categorie_nom || 'N/A'} | Auteur : ${a.auteur_prenom || ''} ${a.auteur_nom || ''} | Objet : ${(a.expose_sommaire || '').slice(0, 200)}`
        ).join('\n')
        : 'Aucun amendement notable cette semaine.';

    const prompt = `Tu es un journaliste politique spécialisé dans l'activité parlementaire française. Tu rédiges un rapport hebdomadaire de l'Assemblée Nationale destiné au grand public, avec un style clair, factuel et accessible.

Période couverte : ${semaineLabel}

=== SCRUTINS (votes) ===
${scrutinsText}

=== QUESTIONS AU GOUVERNEMENT (QaGs) ===
Répartition par thème :
${qagsText}

Total : ${qags.length} question(s) au gouvernement cette semaine.

=== AMENDEMENTS ADOPTÉS OU REJETÉS ===
${amendementsText}

Total : ${amendements.length} amendement(s) cette semaine.

---
Ta mission est de produire un rapport structuré selon le JSON ci-dessous.

RÈGLES :
- Le "narratif" est un résumé de 3 à 5 phrases du contexte politique général et des événements marquants de la semaine. Style journalistique, accessible.
- Les "scrutins_marquants" : sélectionne jusqu'à 5 scrutins les plus significatifs (importance politique, résultat serré, fort nombre de votants). Pour chacun : une phrase commentant l'enjeu ou le résultat.
- Les "themes_qags" : déduis les 4-5 grandes thématiques dominantes des questions au gouvernement. Pour chacun : un titre court et une description de 1-2 phrases sur ce que les députés ont soulevé.
- Les "amendements_marquants" : sélectionne jusqu'à 4 amendements notables (adoptés de justesse ou rejetés malgré soutien large, ou portant sur un enjeu public fort). Pour chacun : une phrase de commentaire.
- Si une section n'a pas de données, mets un tableau vide [].

Réponds UNIQUEMENT avec ce JSON :
{
  "narratif": "...",
  "scrutins_marquants": [
    { "uid": "...", "commentaire": "..." }
  ],
  "themes_qags": [
    { "theme": "...", "description": "..." }
  ],
  "amendements_marquants": [
    { "uid": "...", "commentaire": "..." }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Réponse OpenAI vide');
    return JSON.parse(content);
};

// --- Sauvegarde ---

const sauvegarderRapport = async (rapport) => {
    await pool.query(
        `INSERT INTO rapports_hebdo (semaine_debut, semaine_fin, narratif, scrutins, themes_qags, amendements, computed_at)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, NOW())
         ON CONFLICT (semaine_debut) DO UPDATE SET
            semaine_fin  = EXCLUDED.semaine_fin,
            narratif     = EXCLUDED.narratif,
            scrutins     = EXCLUDED.scrutins,
            themes_qags  = EXCLUDED.themes_qags,
            amendements  = EXCLUDED.amendements,
            computed_at  = NOW()`,
        [
            debutStr,
            finStr,
            rapport.narratif || null,
            JSON.stringify(rapport.scrutins_marquants || []),
            JSON.stringify(rapport.themes_qags || []),
            JSON.stringify(rapport.amendements_marquants || []),
        ]
    );
};

// --- Main ---

const run = async () => {
    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY manquant dans .env');
        process.exit(1);
    }

    // Créer la table si elle n'existe pas
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const sql = fs.readFileSync(path.join(__dirname, '../table_rapports_hebdo.sql'), 'utf8');
    await pool.query(sql);

    const [scrutins, qags, amendements] = await Promise.all([
        fetchScrutins(),
        fetchQags(),
        fetchAmendements(),
    ]);

    console.log(`  ${scrutins.length} scrutin(s), ${qags.length} QaG(s), ${amendements.length} amendement(s) trouvé(s).`);

    if (scrutins.length === 0 && qags.length === 0 && amendements.length === 0) {
        console.log('Aucune activité parlementaire cette semaine. Rapport non généré.');
        return;
    }

    console.log('Appel OpenAI...');
    const rapport = await genererRapport(scrutins, qags, amendements);

    await sauvegarderRapport(rapport);
    await logSeed('rapport-hebdo');

    console.log('Rapport hebdomadaire sauvegardé avec succès.');
};

run().finally(() => pool.end());
