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
