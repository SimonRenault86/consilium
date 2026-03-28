import pool from '../../db/dbManager.js';

// Charge tous les députés depuis la DB (résultat mis en cache au premier appel)
let _deputes = null;
export const getDeputes = async () => {
    if (_deputes) return _deputes;
    const { rows } = await pool.query('SELECT * FROM deputes ORDER BY nom, prenom');
    // Normalise les colonnes snake_case → camelCase attendu par la vue
    _deputes = rows.map(r => ({
        id: r.id,
        prenom: r.prenom,
        nom: r.nom,
        civ: r.civ,
        naissance: r.naissance,
        groupeAbrev: r.groupe_abrev,
        groupe: r.groupe_abrev,
        departementCode: r.departement_code,
        departementNom: r.departement_nom,
        circo: r.circo,
        slug: r.slug,
        datePriseFonction: r.date_prise_fonction,
        scoreParticipation: r.score_participation,
        scoreLoyaute: r.score_loyaute,
        nombreMandats: r.nombre_mandats,
    }));
    return _deputes;
};

export const toSlug = text =>
    text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const formatDate = dateStr => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};
