import pool from '../dbManager.js';

export default class DeputeVote {
    // Retourne tous les votes d'un député avec le détail du scrutin
    static async findByDepute (idDepute) {
        const { rows } = await pool.query(
            `SELECT dv.id_vote, dv.position,
                    v.numero, v.date_scrutin, v.titre, v.sort
             FROM deputes_votes dv
             JOIN votes v ON v.uid = dv.id_vote
             WHERE dv.id_depute = $1
             ORDER BY v.numero DESC`,
            [idDepute]
        );
        return rows;
    }

    // Stats agrégées + 5 derniers votes d'un député
    static async findStatsByDepute (idDepute) {
        const [statsResult, recentsResult] = await Promise.all([
            pool.query(
                `SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE position = 'pour') AS pour,
                    COUNT(*) FILTER (WHERE position = 'contre') AS contre,
                    COUNT(*) FILTER (WHERE position = 'abstention') AS abstentions,
                    (SELECT COUNT(*) FROM votes) - COUNT(*) AS non_participation
                 FROM deputes_votes
                 WHERE id_depute = $1`,
                [idDepute]
            ),
            pool.query(
                `SELECT dv.id_vote, dv.position,
                        v.numero, v.date_scrutin, v.titre, v.sort,
                        v.code_type_vote, tv.libelle AS type_vote_libelle
                 FROM deputes_votes dv
                 JOIN votes v ON v.uid = dv.id_vote
                 LEFT JOIN type_votes tv ON tv.code = v.code_type_vote
                 WHERE dv.id_depute = $1
                 ORDER BY v.numero DESC
                 LIMIT 5`,
                [idDepute]
            ),
        ]);
        const s = statsResult.rows[0];
        return {
            total: parseInt(s.total, 10),
            pour: parseInt(s.pour, 10),
            contre: parseInt(s.contre, 10),
            abstentions: parseInt(s.abstentions, 10),
            nonParticipation: parseInt(s.non_participation, 10),
            derniersVotes: recentsResult.rows.map(v => ({
                uid: v.id_vote,
                numero: v.numero,
                titre: v.titre,
                sort: v.sort,
                position: v.position,
                typeVote: v.code_type_vote ? { code: v.code_type_vote, libelle: v.type_vote_libelle } : null,
                dateScrutin: v.date_scrutin instanceof Date
                    ? v.date_scrutin.toISOString().slice(0, 10)
                    : String(v.date_scrutin).slice(0, 10),
            })),
        };
    }

    // Insère les positions de vote en bulk pour un scrutin donné
    // votants : [{ id_depute, position }]
    static async insertBulk (idVote, votants, client) {
        if (!votants.length) return;

        // Chunk de 500 lignes max pour rester sous la limite de 65535 paramètres PG
        const CHUNK = 500;
        for (let i = 0; i < votants.length; i += CHUNK) {
            const chunk = votants.slice(i, i + CHUNK);
            const values = chunk.map((_, j) => `($1, $${j * 2 + 2}, $${j * 2 + 3})`).join(', ');
            const params = [idVote, ...chunk.flatMap(v => [v.id_depute, v.position])];
            await client.query(
                `INSERT INTO deputes_votes (id_vote, id_depute, position)
                 VALUES ${values}
                 ON CONFLICT (id_vote, id_depute) DO UPDATE SET position = EXCLUDED.position`,
                params
            );
        }
    }
}
