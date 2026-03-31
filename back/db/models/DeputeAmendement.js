import pool from '../dbManager.js';

export default class DeputeAmendement {
    static async findByDepute (idDepute) {
        const { rows } = await pool.query(
            `SELECT da.id_amendement, da.role,
                    a.numero_long, a.date_depot, a.article_titre, a.sort
             FROM deputes_amendements da
             JOIN amendements a ON a.uid = da.id_amendement
             WHERE da.id_depute = $1
             ORDER BY a.date_depot DESC`,
            [idDepute]
        );
        return rows;
    }

    static async insertBulk (idAmendement, signataires, client) {
        if (!signataires.length) return;

        const CHUNK = 500;
        for (let i = 0; i < signataires.length; i += CHUNK) {
            const chunk = signataires.slice(i, i + CHUNK);
            const values = chunk.map((_, j) => `($1, $${j * 2 + 2}, $${j * 2 + 3})`).join(', ');
            const params = [idAmendement, ...chunk.flatMap(s => [s.id_depute, s.role])];
            await client.query(
                `INSERT INTO deputes_amendements (id_amendement, id_depute, role)
                 VALUES ${values}
                 ON CONFLICT (id_amendement, id_depute) DO UPDATE SET role = EXCLUDED.role`,
                params
            );
        }
    }
}
