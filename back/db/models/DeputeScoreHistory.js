import pool from '../dbManager.js';

export default class DeputeScoreHistory {

    static async upsertMany (records) {
        if (!records.length) return;

        const values = records.flatMap(r => [
            r.idDepute,
            r.dateMaj,
            r.scoreParticipation ?? null,
            r.scoreParticipationSpecialite ?? null,
            r.scoreLoyaute ?? null,
            r.scoreMajorite ?? null,
        ]);

        const placeholders = records.map((_, i) => {
            const base = i * 6;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
        }).join(', ');

        await pool.query(`
            INSERT INTO deputes_scores_history
                (id_depute, date_maj, score_participation, score_participation_specialite, score_loyaute, score_majorite)
            VALUES ${placeholders}
            ON CONFLICT (id_depute, date_maj) DO UPDATE SET
                score_participation             = EXCLUDED.score_participation,
                score_participation_specialite  = EXCLUDED.score_participation_specialite,
                score_loyaute                   = EXCLUDED.score_loyaute,
                score_majorite                  = EXCLUDED.score_majorite
        `, values);
    }

    static async upsertParticipationMensuelle (records) {
        if (!records.length) return;

        const values = records.flatMap(r => [
            r.idDepute,
            r.dateMaj,
            r.scoreParticipationMensuelle,
        ]);

        const placeholders = records.map((_, i) => {
            const base = i * 3;
            return `($${base + 1}, $${base + 2}, $${base + 3})`;
        }).join(', ');

        await pool.query(`
            INSERT INTO deputes_scores_history
                (id_depute, date_maj, score_participation_mensuelle)
            VALUES ${placeholders}
            ON CONFLICT (id_depute, date_maj) DO UPDATE SET
                score_participation_mensuelle = EXCLUDED.score_participation_mensuelle
        `, values);
    }

    static async findByDepute (idDepute) {
        const { rows } = await pool.query(`
            SELECT
                sh.date_maj,
                COALESCE(sh.score_participation_mensuelle, sh.score_participation) AS score_participation,
                sh.score_participation_specialite,
                sh.score_loyaute,
                sh.score_majorite,
                nat.avg_participation
            FROM deputes_scores_history sh
            LEFT JOIN (
                SELECT
                    date_maj,
                    AVG(COALESCE(score_participation_mensuelle, score_participation)) AS avg_participation
                FROM deputes_scores_history
                WHERE COALESCE(score_participation_mensuelle, score_participation) IS NOT NULL
                GROUP BY date_maj
            ) nat ON nat.date_maj = sh.date_maj
            WHERE sh.id_depute = $1
            ORDER BY sh.date_maj ASC
        `, [idDepute]);
        return rows;
    }
}
