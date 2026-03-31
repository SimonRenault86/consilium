import pool from '../dbManager.js';

export default class Senateur {
    // Retourne tous les sénateurs actuellement en mandat
    static async findActifs () {
        const { rows } = await pool.query(
            `SELECT s.*, a.nom, a.prenom, a.civ
            FROM senateurs s
            JOIN acteurs a ON a.id = s.acteur_id
            WHERE s.date_fin IS NULL
            ORDER BY a.nom, a.prenom`
        );
        return rows;
    }

    // Retourne tous les mandats d'un acteur au Sénat
    static async findByActeur (acteurId) {
        const { rows } = await pool.query(
            'SELECT * FROM senateurs WHERE acteur_id = $1 ORDER BY date_debut',
            [acteurId]
        );
        return rows;
    }

    // Retourne tous les sénateurs d'un département
    static async findByDepartement (numDepartement) {
        const { rows } = await pool.query(
            `SELECT s.*, a.nom, a.prenom, a.civ
            FROM senateurs s
            JOIN acteurs a ON a.id = s.acteur_id
            WHERE s.num_departement = $1 AND s.date_fin IS NULL
            ORDER BY a.nom, a.prenom`,
            [numDepartement]
        );
        return rows;
    }

    static async upsert (senateur) {
        const { rows } = await pool.query(
            `INSERT INTO senateurs (
                id, acteur_id, organe_ref, num_departement,
                date_debut, date_fin, premiere_election, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (id) DO UPDATE SET
                acteur_id           = EXCLUDED.acteur_id,
                organe_ref          = EXCLUDED.organe_ref,
                num_departement     = EXCLUDED.num_departement,
                date_debut          = EXCLUDED.date_debut,
                date_fin            = EXCLUDED.date_fin,
                premiere_election   = EXCLUDED.premiere_election,
                updated_at          = NOW()
            RETURNING *`,
            [
                senateur.id, senateur.acteurId, senateur.organeRef, senateur.numDepartement,
                senateur.dateDebut, senateur.dateFin, senateur.premiereElection,
            ]
        );
        return rows[0];
    }

    static async upsertMany (senateurs) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const senateur of senateurs) {
                await Senateur.upsert(senateur);
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
