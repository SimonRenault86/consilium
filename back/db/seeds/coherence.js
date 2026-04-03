import 'dotenv/config';
import dayjs from 'dayjs';
import 'dayjs/locale/fr.js';
import DeputeCoherence from '../models/DeputeCoherence.js';

dayjs.locale('fr');

// Délai entre chaque appel OpenAI (ms) pour respecter les rate limits
const DELAY_MS = 400;

// Positionnement politique des groupes (gouvernement Bayrou, 16ème législature)
const POSITIONNEMENT = {
    EPR:    { label: 'majorité gouvernementale (Renaissance / Ensemble pour la République)', camp: 'majorité' },
    HOR:    { label: 'majorité gouvernementale (Horizons)', camp: 'majorité' },
    DEM:    { label: 'majorité gouvernementale (MoDem / Les Démocrates)', camp: 'majorité' },
    DR:     { label: 'droite républicaine, soutien ponctuel au gouvernement', camp: 'droite de gouvernement' },
    LFI:    { label: 'opposition de gauche radicale (La France insoumise)', camp: 'opposition' },
    ECOS:   { label: 'opposition de gauche écologiste', camp: 'opposition' },
    GDR:    { label: 'opposition de gauche (Gauche Démocrate et Républicaine - PCF)', camp: 'opposition' },
    SOC:    { label: 'opposition socialiste', camp: 'opposition' },
    RN:     { label: "opposition d'extrême droite (Rassemblement National)", camp: 'opposition' },
    UDDPLR: { label: 'opposition de droite dure', camp: 'opposition' },
    LIOT:   { label: 'groupe centriste indépendant', camp: 'indépendant' },
    NI:     { label: 'non inscrit', camp: 'indépendant' },
};

// Parsing de l'argument --mois=YYYY-MM (défaut : mois courant)
const moisArg = process.argv.slice(2).find(a => a.startsWith('--mois='))?.split('=')[1];
const moisDayjs = moisArg ? dayjs(moisArg + '-01') : dayjs().subtract(1, 'month').startOf('month');
if (!moisDayjs.isValid()) {
    console.error(`Mois invalide : "${moisArg}". Format attendu : YYYY-MM`);
    process.exit(1);
}

const moisLabel = moisDayjs.format('YYYY-MM'); // "2026-04"
const moisPgDate = moisDayjs.format('YYYY-MM-DD'); // "2026-04-01" pour PostgreSQL
const debutMois = moisDayjs.format('YYYY-MM-DD');
const finMois = moisDayjs.add(1, 'month').format('YYYY-MM-DD');

/**
 * Appelle OpenAI pour générer les insights de cohérence d'un député.
 * @param {string} nomComplet
 * @param {string} moisLabel  - ex: "mars 2026"
 * @param {Array}  croisements
 * @returns {{ recap: string, resume: string, statut: string, insights: Array<{categorie, insight}> }}
 */
const analyseCoherence = async (nomComplet, moisHumain, groupe, groupeAbrev, croisements) => {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY manquant dans .env');

    const positionnement = POSITIONNEMENT[groupeAbrev];
    const contexteGroupe = positionnement
        ? `Groupe parlementaire : ${groupe} (${positionnement.label})\nPositionnement : ${positionnement.camp}`
        : `Groupe parlementaire : ${groupe || 'inconnu'}`;

    const lignes = croisements.map(c => {
        const lines = [
            `• Catégorie "${c.categorie}" :`,
            `  - QAGs posées au gouvernement : ${c.nb_qags}`,
        ];
        if (c.nb_votes === 0) {
            lines.push('  - Votes : AUCUN vote enregistré sur ce thème depuis le début du mandat');
        } else {
            const tauxAlignement = Math.round((c.nb_aligne_groupe / c.nb_votes) * 100);
            lines.push(`  - Votes personnels : ${c.nb_pour} POUR, ${c.nb_contre} CONTRE, ${c.nb_abstention} ABSTENTION (total ${c.nb_votes} scrutins)`);
            lines.push(`  - Discipline de groupe : ${c.nb_aligne_groupe} vote(s) aligné(s) avec la position majoritaire de son groupe, ${c.nb_diverge_groupe} divergence(s) (${tauxAlignement}% d'alignement)`);
        }
        return lines.join('\n');
    }).join('\n');

    const prompt = `Tu es un analyste politique spécialisé dans le suivi de l'activité parlementaire française.

Député analysé : ${nomComplet}
${contexteGroupe}
Période des questions au gouvernement (QAGs) : ${moisHumain}
Votes : historique complet du mandat

CONTEXTE IMPORTANT : L'analyse repose sur trois dimensions complémentaires.

1. POSITIONNEMENT CAMP
Les QAGs (questions au gouvernement) sont presque toujours posées par l'opposition pour critiquer la politique gouvernementale. Pour un député de majorité, poser des QAGs sur un sujet signifie qu'il défend activement cette politique. Pour un député d'opposition, poser des QAGs signifie qu'il critique cette politique.
La cohérence ne se mesure donc PAS par une règle universelle "vote POUR = cohérent" : elle dépend du camp politique.
- Pour un député de MAJORITÉ : vote POUR sur un thème qu'il défend en QAG → cohérent. Vote massivement CONTRE → dissidence notable.
- Pour un député d'OPPOSITION : vote CONTRE sur un thème qu'il critique en QAG → comportement attendu et cohérent. Vote POUR → potentiellement incohérent.
- CAS PARTICULIER : si "AUCUN vote enregistré" sur un thème malgré des QAGs → abstentionnisme sélectif à signaler explicitement.

2. DISCIPLINE DE GROUPE
Pour chaque thème, tu disposes du taux d'alignement du député avec la position majoritaire de son groupe parlementaire.
- Alignement > 80% : il vote en bloc avec son groupe → discipline standard, pas de signalement particulier.
- Alignement 50-80% : dissidences ponctuelles → posture mitigée à mentionner selon les thèmes.
- Alignement < 50% : forte dissidence intra-groupe → incohérence notable même si le discours en QAG semble cohérent.
La discipline de groupe est un signal fort de cohérence réelle vs discours : un député peut critiquer en QAG mais voter avec son groupe par discipline partisane.

3. COHÉRENCE DISCOURS / VOTE
La vraie incohérence est quand un député vote à rebours de ses prises de position publiques en QAG ET de la ligne attendue de son camp ou de son groupe.

Pour chaque thème ci-dessous, tu disposes du nombre de questions posées par ce député en ${moisHumain}, et du bilan TOTAL de ses votes parlementaires sur ce même thème depuis le début de son mandat.

${lignes}

Ta mission :
1. "statut" : évaluation globale de la cohérence, en combinant les trois dimensions (camp, discipline de groupe, cohérence discours/vote). Doit être EXACTEMENT l'une de ces trois valeurs : "coherent", "mitige", "incoherent".
   - "coherent" : discours QAG aligné avec son camp ET discipline de groupe élevée ET cohérence vote/QAG.
   - "incoherent" : contradiction nette entre QAGs et votes ET/OU forte dissidence intra-groupe (< 50% d'alignement).
   - "mitige" : posture ambivalente — certains thèmes cohérents, d'autres non, ou discipline partielle.
2. "recap" : UNE seule phrase percutante et factuelle (max 20 mots) résumant la principale tension ou cohérence, en mentionnant camp et/ou discipline si pertinent.
3. "resume" : synthèse globale en 2 phrases maximum intégrant les trois dimensions : posture publique (QAGs), comportement de vote par rapport à son camp, et discipline au sein de son groupe.
4. "insights" : pour chaque catégorie, une phrase courte (max 30 mots) factuelle décrivant la cohérence ou l'incohérence en tenant compte du discours (QAGs), du vote personnel ET du taux d'alignement avec le groupe.

Réponds UNIQUEMENT avec ce JSON :
{
  "statut": "coherent" | "mitige" | "incoherent",
  "recap": "...",
  "resume": "...",
  "insights": [
    { "categorie": "Nom exact de la catégorie", "insight": "..." }
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
            temperature: 0.3,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
};

const run = async () => {
    const moisHumain = moisDayjs.format('MMMM YYYY');
    console.log(`📅 Période analysée : ${moisHumain} (${debutMois} → ${finMois})`);
    console.log('🔍 Récupération des députés éligibles...');

    const deputes = await DeputeCoherence.findDeputesWithData(debutMois, finMois);
    console.log(`✅ ${deputes.length} député(s) avec QAGs et votes catégorisés ce mois\n`);

    if (deputes.length === 0) {
        console.log('Aucun député avec des données suffisantes pour cette période.');
        console.log('Assurez-vous d\'avoir exécuté : seed:categorise-scrutins et seed:categorise-qags');
        process.exit(0);
    }

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const depute of deputes) {
        const nomComplet = `${depute.prenom} ${depute.nom}`;

        try {
            const [qagsCats, votesCats] = await Promise.all([
                DeputeCoherence.findQagsCatsByDepute(depute.id_depute, debutMois, finMois),
                DeputeCoherence.findVotesCatsByDepute(depute.id_depute),
            ]);

            // Toutes les catégories avec QAGs ce mois sont incluses.
            // Celles sans vote enregistré sont marquées nb_votes=0 → considérées comme incohérentes.
            const votesMap = Object.fromEntries(votesCats.map(v => [v.categorie_id, v]));
            const croisements = qagsCats.map(q => {
                const v = votesMap[q.categorie_id];
                return {
                    categorie:         q.categorie,
                    categorie_id:      parseInt(q.categorie_id, 10),
                    couleur:           q.couleur,
                    nb_qags:           parseInt(q.nb_qags, 10),
                    nb_votes:          v ? parseInt(v.nb_votes, 10) : 0,
                    nb_pour:           v ? parseInt(v.nb_pour, 10) : 0,
                    nb_contre:         v ? parseInt(v.nb_contre, 10) : 0,
                    nb_abstention:     v ? parseInt(v.nb_abstention, 10) : 0,
                    nb_aligne_groupe:  v ? parseInt(v.nb_aligne_groupe, 10) : 0,
                    nb_diverge_groupe: v ? parseInt(v.nb_diverge_groupe, 10) : 0,
                };
            });

            if (croisements.length === 0) {
                console.log(`⏭️  ${nomComplet} : aucune QAG catégorisée ce mois`);
                skipped++;
                continue;
            }

            console.log(`🤖 Analyse de ${nomComplet} (${croisements.length} croisement(s))...`);

            const result = await analyseCoherence(nomComplet, moisHumain, depute.groupe, depute.groupe_abrev, croisements);

            // Fusion des données chiffrées avec les insights générés
            const insightMap = Object.fromEntries(
                (result.insights || []).map(i => [i.categorie.toLowerCase().trim(), i.insight])
            );
            const coherence = croisements.map(c => ({
                ...c,
                insight: insightMap[c.categorie.toLowerCase().trim()] || null,
            }));

            await DeputeCoherence.upsert({
                idDepute:  depute.id_depute,
                mois:      moisPgDate,
                statut:    result.statut || null,
                recap:     result.recap || null,
                resume:    result.resume || null,
                coherence,
            });

            processed++;
            console.log(`   ✅ ${nomComplet}`);

            await new Promise(r => setTimeout(r, DELAY_MS));
        } catch (err) {
            errors++;
            console.error(`   ❌ ${nomComplet} : ${err.message}`);
        }
    }

    console.log(`\n📊 Terminé — ${processed} analysé(s), ${skipped} ignoré(s), ${errors} erreur(s)`);
    process.exit(0);
};

run();