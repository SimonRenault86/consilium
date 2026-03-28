import pool from '../dbManager.js';

export default class Parti {
    static async findAll () {
        const { rows } = await pool.query('SELECT * FROM partis ORDER BY ordre');
        return rows;
    }

    static async findByAbrev (abrev) {
        const { rows } = await pool.query('SELECT * FROM partis WHERE abrev = $1', [abrev]);
        return rows[0] || null;
    }

    static async upsert (parti) {
        const { rows } = await pool.query(
            `INSERT INTO partis (abrev, nom, couleur, couleur2, logo, ordre, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (abrev) DO UPDATE SET
                nom                     = EXCLUDED.nom,
                couleur                 = EXCLUDED.couleur,
                couleur2                = EXCLUDED.couleur2,
                logo                    = EXCLUDED.logo,
                ordre     = EXCLUDED.ordre,
                updated_at              = NOW()
            RETURNING *`,
            [parti.abrev, parti.nom, parti.couleur, parti.couleur2, parti.logo, parti.ordre]
        );
        return rows[0];
    }

    static async upsertMany (partis) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const parti of partis) {
                await Parti.upsert(parti);
            }
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
