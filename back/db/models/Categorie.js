import pool from '../dbManager.js';

export default class Categorie {
    static async findAll () {
        const { rows } = await pool.query(
            'SELECT id, nom, couleur FROM scrutin_categories ORDER BY nom'
        );
        return rows;
    }

    static async upsert ({ nom, couleur }) {
        const { rows } = await pool.query(
            `INSERT INTO scrutin_categories (nom, couleur) VALUES ($1, $2)
            ON CONFLICT (nom) DO UPDATE SET couleur = EXCLUDED.couleur
            RETURNING id`,
            [nom, couleur]
        );
        return rows[0].id;
    }
}
