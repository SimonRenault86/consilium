import pool from '../dbManager.js';

export default class DeputeCoherence {

    // Retourne l'analyse du mois demandé, ou la plus récente si aucun mois fourni
    static async findByDepute (idDepute, mois = null) {
        if (mois) {
            const { rows } = await pool.query(
                `SELECT id_depute, mois, recap, resume, statut, coherence, computed_at
                 FROM depute_coherence
                 WHERE id_depute = $1 AND mois = $2`,
                [idDepute, mois + '-01']
            );
            return rows[0] || null;
        }
        const { rows } = await pool.query(
            `SELECT id_depute, mois, recap, resume, statut, coherence, computed_at
             FROM depute_coherence
             WHERE id_depute = $1
             ORDER BY mois DESC
             LIMIT 1`,
            [idDepute]
        );
        return rows[0] || null;
    }

    // Retourne pour tous les députés analysés leur statut de cohérence (calculé par OpenAI lors du seed)
    static async findAllBadges () {
        const { rows } = await pool.query(`
            SELECT DISTINCT ON (id_depute)
                id_depute,
                statut,
                recap
            FROM depute_coherence
            WHERE statut IS NOT NULL
            ORDER BY id_depute, mois DESC
        `);

        const badges = {};
        for (const row of rows) {
            badges[row.id_depute] = { statut: row.statut, recap: row.recap || null };
        }
        return badges;
    }


    // Retourne toutes les analyses d'un député, triées du plus récent au plus ancien
    static async findAllByDepute (idDepute) {
        const { rows } = await pool.query(
            `SELECT id_depute, mois, recap, resume, statut, coherence, computed_at
             FROM depute_coherence
             WHERE id_depute = $1
             ORDER BY mois DESC`,
            [idDepute]
        );
        return rows;
    }

    static async findMoisByDepute (idDepute) {
        const { rows } = await pool.query(
            `SELECT TO_CHAR(mois, 'YYYY-MM') AS mois
             FROM depute_coherence
             WHERE id_depute = $1
             ORDER BY mois DESC`,
            [idDepute]
        );
        return rows.map(r => r.mois);
    }

    // Crée ou met à jour l'analyse d'un député pour un mois donné (YYYY-MM-01)
    static async upsert ({ idDepute, mois, recap, resume, statut, coherence }) {
        await pool.query(
            `INSERT INTO depute_coherence (id_depute, mois, recap, resume, statut, coherence, computed_at)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
             ON CONFLICT (id_depute, mois) DO UPDATE SET
                recap       = EXCLUDED.recap,
                resume      = EXCLUDED.resume,
                statut      = EXCLUDED.statut,
                coherence   = EXCLUDED.coherence,
                computed_at = NOW()`,
            [idDepute, mois, recap, resume, statut, JSON.stringify(coherence)]
        );
    }

    // Retourne les députés ayant posé des QAGs ce mois ET ayant des votes catégorisés (tout historique)
    static async findDeputesWithData (debutMois, finMois) {
        const { rows } = await pool.query(
            `SELECT DISTINCT d.id AS id_depute, a.nom, a.prenom, d.groupe, d.groupe_abrev
             FROM deputes d
             JOIN acteurs a ON a.id = d.id
             WHERE EXISTS (
                 SELECT 1 FROM qags q
                 WHERE q.acteur_ref = d.id
                   AND q.qag_categorie_id IS NOT NULL
                   AND q.date_seance >= $1
                   AND q.date_seance < $2
             )
             AND EXISTS (
                 SELECT 1 FROM deputes_votes dv
                 JOIN scrutins s ON s.uid = dv.id_vote
                 WHERE dv.id_depute = d.id
                   AND s.scrutin_categorie_id IS NOT NULL
             )
             ORDER BY a.nom, a.prenom`,
            [debutMois, finMois]
        );
        return rows;
    }

    // QAGs d'un député groupées par catégorie sur une période
    static async findQagsCatsByDepute (idDepute, debutMois, finMois) {
        const { rows } = await pool.query(
            `SELECT sc.id AS categorie_id, sc.nom AS categorie, sc.couleur,
                    COUNT(*) AS nb_qags
             FROM qags q
             JOIN scrutin_categories sc ON sc.id = q.qag_categorie_id
             WHERE q.acteur_ref = $1
               AND q.date_seance >= $2
               AND q.date_seance < $3
             GROUP BY sc.id, sc.nom, sc.couleur
             ORDER BY nb_qags DESC`,
            [idDepute, debutMois, finMois]
        );
        return rows;
    }

    // Votes d'un député groupés par catégorie — tout l'historique
    static async findVotesCatsByDepute (idDepute) {
        const { rows } = await pool.query(
            `SELECT sc.id AS categorie_id, sc.nom AS categorie, sc.couleur,
                    COUNT(*) AS nb_votes,
                    COUNT(*) FILTER (WHERE dv.position = 'pour')       AS nb_pour,
                    COUNT(*) FILTER (WHERE dv.position = 'contre')     AS nb_contre,
                    COUNT(*) FILTER (WHERE dv.position = 'abstention') AS nb_abstention
             FROM deputes_votes dv
             JOIN scrutins s ON s.uid = dv.id_vote
             JOIN scrutin_categories sc ON sc.id = s.scrutin_categorie_id
             WHERE dv.id_depute = $1
             GROUP BY sc.id, sc.nom, sc.couleur
             ORDER BY nb_votes DESC`,
            [idDepute]
        );
        return rows;
    }
}

