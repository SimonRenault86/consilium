import 'dotenv/config';
import Categorie from '../../models/Categorie.js';
import SousCategorie from '../../models/SousCategorie.js';

// Nombre de scrutins envoyés à OpenAI par requête
const OPENAI_BATCH_SIZE = 50;

// votes: Array<{ uid: string, titre: string }>
// Retourne: { [uid]: sousCategorieId }
const categoriseVotes = async votes => {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY manquant dans .env');

    const [categories, sousCategories] = await Promise.all([
        Categorie.findAll(),
        SousCategorie.findAll(),
    ]);

    // Affiche la hiérarchie existante dans le prompt
    const arbre = categories.map(cat => {
        const subs = sousCategories.filter(sc => sc.categorie_id === cat.id).map(sc => sc.nom);
        return subs.length > 0 ? `${cat.nom} (sous-catégories : ${subs.join(', ')})` : cat.nom;
    }).join('\n- ');

    const prompt = `Tu es un assistant spécialisé dans la classification de scrutins parlementaires français.

Hiérarchie de catégories existantes :
${arbre.length > 0 ? `- ${arbre}` : 'Aucune catégorie pour l\'instant.'}

Règles STRICTES :
1. Chaque scrutin DOIT avoir une "categorie" racine parmi : Économie, Écologie, Social, Santé, Éducation, Justice, Sécurité, International, Institutions, Agriculture, Transport, Numérique, Logement, Culture, Immigration, Budget, Défense. Utilise une existante en priorité.
2. La "sous_categorie" est OPTIONNELLE. Crée-en une UNIQUEMENT si le scrutin porte sur un sous-thème précis qui concerne plusieurs scrutins (ex: Social > Retraites, Santé > Médicaments, Écologie > Énergie, Économie > Fiscalité). Omets-la (null) pour les scrutins génériques (ex: un amendement budgétaire parmi des dizaines).
3. INTERDIT : ne crée JAMAIS une sous-catégorie qui reprend le nom de la catégorie racine (ex: Santé > Santé est invalide), ni une sous-catégorie basée sur la procédure parlementaire (ex: "Motion de censure", "Amendement", "Rejet préalable").
4. Si tu crées une nouvelle catégorie racine (hors liste), fournis une couleur hexadécimale thématique.

Scrutins à classer :
${votes.map((v, i) => `${i + 1}. uid="${v.uid}" | "${v.titre}"`).join('\n')}

Réponds UNIQUEMENT avec un objet JSON :
{
  "nouvelles_categories": [{"nom": "...", "couleur": "#xxxxxx"}],
  "nouvelles_sous_categories": [{"nom": "...", "parent": "catégorie racine"}],
  "classifications": [{"uid": "...", "categorie": "...", "sous_categorie": "...ou null"}]
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
            temperature: 0.2,
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    // Couleurs par défaut pour les catégories standard (clés en minuscules normalisées)
    const defaultColors = {
        'économie': '#2563eb', 'écologie': '#16a34a', 'social': '#dc2626',
        'santé': '#e11d48', 'éducation': '#d97706', 'justice': '#7c3aed',
        'sécurité': '#1e40af', 'international': '#0891b2', 'institutions': '#475569',
        'agriculture': '#65a30d', 'transport': '#b45309', 'numérique': '#6366f1',
        'logement': '#a16207', 'culture': '#c026d3', 'immigration': '#be185d',
        'budget': '#b91c1c', 'défense': '#1d4ed8',
    };

    // Collecte toutes les catégories nécessaires : celles de nouvelles_categories + celles référencées dans classifications
    const catNomsToCouleur = new Map();
    for (const cat of (result.nouvelles_categories || [])) {
        // Priorité à la couleur fournie par OpenAI, sinon fallback sur défauts, sinon couleur générique
        if (cat.nom) catNomsToCouleur.set(cat.nom, cat.couleur || defaultColors[cat.nom.toLowerCase().trim()] || '#64748b');
    }
    for (const item of (result.classifications || [])) {
        if (item.categorie && !catNomsToCouleur.has(item.categorie)) {
            catNomsToCouleur.set(item.categorie, defaultColors[item.categorie.toLowerCase().trim()] || '#64748b');
        }
    }

    // 1. Upsert toutes les catégories
    for (const [nom, couleur] of catNomsToCouleur) {
        await Categorie.upsert({ nom, couleur });
    }

    // 2. Recharger pour avoir les IDs des catégories
    const allCats = await Categorie.findAll();
    const catsByNom = Object.fromEntries(allCats.map(c => [c.nom.toLowerCase().trim(), c.id]));

    // Collecte toutes les sous-catégories nécessaires : celles de nouvelles_sous_categories + celles de classifications (si sous_categorie non null)
    const subDefs = new Map(); // clé: "nom|parentNom"
    for (const sub of (result.nouvelles_sous_categories || [])) {
        if (sub.nom && sub.parent) subDefs.set(`${sub.nom}|${sub.parent}`, sub);
    }
    for (const item of (result.classifications || [])) {
        if (item.sous_categorie && item.sous_categorie !== 'null' && item.categorie) {
            const key = `${item.sous_categorie}|${item.categorie}`;
            if (!subDefs.has(key)) subDefs.set(key, { nom: item.sous_categorie, parent: item.categorie });
        }
    }

    // 3. Upsert toutes les sous-catégories
    for (const { nom, parent } of subDefs.values()) {
        const parentId = catsByNom[parent.toLowerCase().trim()] || null;
        if (parentId) {
            await SousCategorie.upsert({ nom, categorieId: parentId });
        } else {
            console.warn(`Parent non trouvé pour la sous-catégorie: ${nom} (parent attendu: ${parent})`);
        }
    }

    // 4. Recharger catégories et sous-catégories en parallèle
    const [allCatsFinal, allSubs] = await Promise.all([
        Categorie.findAll(),
        SousCategorie.findAll(),
    ]);
    const catsByNomFinal = Object.fromEntries(allCatsFinal.map(c => [c.nom.toLowerCase().trim(), c.id]));
    const subsByKey = Object.fromEntries(allSubs.map(s => [`${s.nom.toLowerCase().trim()}|${s.categorie_nom.toLowerCase().trim()}`, s.id]));

    const map = {};
    for (const item of (result.classifications || [])) {
        if (!item.categorie) continue;
        const categorieId = catsByNomFinal[item.categorie.toLowerCase().trim()];
        if (!categorieId) {
            console.warn(`Catégorie non trouvée: ${item.categorie}`);
            continue;
        }
        let sousCategorieId = null;
        if (item.sous_categorie && item.sous_categorie !== 'null') {
            const key = `${item.sous_categorie.toLowerCase().trim()}|${item.categorie.toLowerCase().trim()}`;
            sousCategorieId = subsByKey[key] || null;
        }
        map[item.uid] = { categorieId, sousCategorieId };
    }

    return map;
};

export { categoriseVotes, OPENAI_BATCH_SIZE };
