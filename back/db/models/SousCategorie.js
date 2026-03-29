import pool from '../dbManager.js';

export default class SousCategorie {
    static async findAll () {
        const { rows } = await pool.query(
            `SELECT sc.id, sc.nom, sc.categorie_id, c.nom AS categorie_nom, c.couleur
            FROM scrutin_sous_categories sc
            JOIN scrutin_categories c ON c.id = sc.categorie_id
            ORDER BY c.nom, sc.nom`
        );
        return rows;
    }

    static async upsert ({ nom, categorieId }) {
        const { rows } = await pool.query(
            `INSERT INTO scrutin_sous_categories (nom, categorie_id) VALUES ($1, $2)
            ON CONFLICT (nom, categorie_id) DO UPDATE SET nom = EXCLUDED.nom
            RETURNING id`,
            [nom, categorieId]
        );
        return rows[0].id;
    }
}
