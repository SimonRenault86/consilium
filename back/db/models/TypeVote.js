import pool from '../dbManager.js';

export default class TypeVote {
    static async upsert ({ code, libelle }) {
        await pool.query(
            `INSERT INTO type_votes (code, libelle) VALUES ($1, $2)
            ON CONFLICT (code) DO UPDATE SET libelle = EXCLUDED.libelle`,
            [code, libelle]
        );
    }
}
