import pool from '../dbManager.js';

export default class RapportHebdo {

    static serialize (row) {
        return {
            id: row.id,
            semaineDebut: row.semaine_debut,
            semaineFin: row.semaine_fin,
            narratif: row.narratif,
            scrutins: row.scrutins || [],
            themesQags: row.themes_qags || [],
            amendements: row.amendements || [],
            computedAt: row.computed_at,
        };
    }

    // Retourne la liste des semaines disponibles (du plus récent au plus ancien)
    static async findSemaines () {
        const { rows } = await pool.query(
            `SELECT id,
                TO_CHAR(semaine_debut, 'YYYY-MM-DD') AS semaine_debut,
                TO_CHAR(semaine_fin,   'YYYY-MM-DD') AS semaine_fin
             FROM rapports_hebdo
             ORDER BY semaine_debut DESC`
        );
        return rows;
    }

    // Retourne le rapport d'une semaine précise (semaine_debut au format YYYY-MM-DD)
    static async findBySemaine (semaineDebut) {
        const { rows } = await pool.query(
            `SELECT id, narratif, scrutins, themes_qags, amendements, computed_at,
                TO_CHAR(semaine_debut, 'YYYY-MM-DD') AS semaine_debut,
                TO_CHAR(semaine_fin,   'YYYY-MM-DD') AS semaine_fin
             FROM rapports_hebdo WHERE semaine_debut = $1`,
            [semaineDebut]
        );
        return rows[0] ? RapportHebdo.serialize(rows[0]) : null;
    }

    // Retourne le rapport le plus récent
    static async findLatest () {
        const { rows } = await pool.query(
            `SELECT id, narratif, scrutins, themes_qags, amendements, computed_at,
                TO_CHAR(semaine_debut, 'YYYY-MM-DD') AS semaine_debut,
                TO_CHAR(semaine_fin,   'YYYY-MM-DD') AS semaine_fin
             FROM rapports_hebdo ORDER BY semaine_debut DESC LIMIT 1`
        );
        return rows[0] ? RapportHebdo.serialize(rows[0]) : null;
    }
}
