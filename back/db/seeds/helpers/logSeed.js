import pool from '../../dbManager.js';

export async function logSeed (categorie) {
    await pool.query(
        'INSERT INTO seed_logs (categorie, executed_at) VALUES ($1, NOW())',
        [categorie]
    );
}
