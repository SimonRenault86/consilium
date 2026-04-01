import pool from '../dbManager.js';

const SELECT_QAG = `
    SELECT
        q.uid,
        q.numero,
        TO_CHAR(q.date_seance, 'YYYY-MM-DD') AS date_seance,
        q.rubrique,
        q.sujet,
        q.acteur_ref,
        q.groupe_ref,
        q.groupe_abrev,
        q.groupe_developpe,
        q.min_ref,
        q.min_abrege,
        q.min_developpe,
        q.texte_reponse,
        q.code_cloture,
        a.prenom  AS auteur_prenom,
        a.nom     AS auteur_nom,
        a.civ     AS auteur_civ,
        mg.acteur_id AS min_acteur_id,
        am.prenom AS min_prenom,
        am.nom    AS min_nom
    FROM qags q
    LEFT JOIN acteurs a ON a.id = q.acteur_ref
    LEFT JOIN LATERAL (
        SELECT DISTINCT ON (organe_ref) acteur_id
        FROM mandats_gouvernement
        WHERE organe_ref = q.min_ref
        LIMIT 1
    ) mg ON true
    LEFT JOIN acteurs am ON am.id = mg.acteur_id
`;

export default class Qag {
    static async findSessions () {
        const { rows } = await pool.query(`
            SELECT
                TO_CHAR(date_seance, 'YYYY-MM-DD') AS date_seance,
                COUNT(*)::INTEGER AS nb_questions,
                MIN(numero)       AS premier_numero
            FROM qags
            WHERE code_cloture = 'REP_PUB'
            GROUP BY date_seance
            ORDER BY date_seance DESC
        `);
        return rows;
    }

    static async findByGroupe (abrev, limit = 5) {
        const { rows } = await pool.query(`
            ${SELECT_QAG}
            WHERE q.groupe_abrev = $1
              AND q.code_cloture = 'REP_PUB'
            ORDER BY q.date_seance DESC, q.numero ASC
            LIMIT $2
        `, [abrev, limit]);
        return rows;
    }

    static async findByActeur (acteurId, limit = 5) {
        const { rows } = await pool.query(`
            ${SELECT_QAG}
            WHERE q.acteur_ref = $1
              AND q.code_cloture = 'REP_PUB'
            ORDER BY q.date_seance DESC, q.numero ASC
            LIMIT $2
        `, [acteurId, limit]);
        return rows;
    }

    static async findByDate (date) {
        const { rows } = await pool.query(`
            ${SELECT_QAG}
            WHERE q.date_seance = $1
            ORDER BY q.numero ASC
        `, [date]);
        return rows;
    }

    static async upsert (qag) {
        await pool.query(`
            INSERT INTO qags (
                uid, numero, legislature, date_seance, rubrique, sujet,
                acteur_ref, mandat_ref, groupe_ref, groupe_abrev, groupe_developpe,
                min_ref, min_abrege, min_developpe,
                texte_reponse, code_cloture
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            ON CONFLICT (uid) DO UPDATE SET
                numero          = EXCLUDED.numero,
                date_seance     = EXCLUDED.date_seance,
                rubrique        = EXCLUDED.rubrique,
                sujet           = EXCLUDED.sujet,
                groupe_abrev    = EXCLUDED.groupe_abrev,
                groupe_developpe= EXCLUDED.groupe_developpe,
                min_abrege      = EXCLUDED.min_abrege,
                min_developpe   = EXCLUDED.min_developpe,
                texte_reponse   = EXCLUDED.texte_reponse,
                code_cloture    = EXCLUDED.code_cloture
        `, [
            qag.uid, qag.numero, qag.legislature, qag.date_seance, qag.rubrique, qag.sujet,
            qag.acteur_ref, qag.mandat_ref, qag.groupe_ref, qag.groupe_abrev, qag.groupe_developpe,
            qag.min_ref, qag.min_abrege, qag.min_developpe,
            qag.texte_reponse, qag.code_cloture,
        ]);
    }
}
