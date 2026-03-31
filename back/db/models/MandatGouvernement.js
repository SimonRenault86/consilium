import pool from '../dbManager.js';

export default class MandatGouvernement {
    // Retourne tous les mandats gouvernementaux actifs (sans date de fin)
    static async findActifs () {
        const { rows } = await pool.query(
            `SELECT mg.*, a.nom, a.prenom, a.civ
            FROM mandats_gouvernement mg
            JOIN acteurs a ON a.id = mg.acteur_id
            WHERE mg.date_fin IS NULL AND mg.type_organe = 'MINISTERE'
            ORDER BY mg.preseance`
        );
        return rows;
    }

    // Retourne tous les mandats ministériels (passés + actuels) avec info acteur
    static async findAllMinisteres () {
        const { rows } = await pool.query(
            `SELECT mg.*, a.nom, a.prenom, a.civ
            FROM mandats_gouvernement mg
            JOIN acteurs a ON a.id = mg.acteur_id
            WHERE mg.type_organe = 'MINISTERE'
            ORDER BY mg.preseance, mg.date_debut DESC`
        );
        return rows;
    }

    // Retourne tous les mandats d'un acteur
    static async findByActeur (acteurId) {
        const { rows } = await pool.query(
            'SELECT * FROM mandats_gouvernement WHERE acteur_id = $1 ORDER BY date_debut',
            [acteurId]
        );
        return rows;
    }

    // Retourne tous les ministres (type MINISTERE) pour un gouvernement donné (organe_ref)
    static async findByGouvernement (organeRef) {
        const { rows } = await pool.query(
            `SELECT mg.*, a.nom, a.prenom, a.civ
            FROM mandats_gouvernement mg
            JOIN acteurs a ON a.id = mg.acteur_id
            WHERE mg.organe_ref = $1 AND mg.type_organe = 'MINISTERE'
            ORDER BY mg.preseance`,
            [organeRef]
        );
        return rows;
    }

    static async upsert (mandat) {
        const { rows } = await pool.query(
            `INSERT INTO mandats_gouvernement (
                id, acteur_id, type_organe, organe_ref, qualite,
                legislature, date_debut, date_fin, preseance, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (id) DO UPDATE SET
                acteur_id   = EXCLUDED.acteur_id,
                type_organe = EXCLUDED.type_organe,
                organe_ref  = EXCLUDED.organe_ref,
                qualite     = EXCLUDED.qualite,
                legislature = EXCLUDED.legislature,
                date_debut  = EXCLUDED.date_debut,
                date_fin    = EXCLUDED.date_fin,
                preseance   = EXCLUDED.preseance,
                updated_at  = NOW()
            RETURNING *`,
            [
                mandat.id, mandat.acteurId, mandat.typeOrgane, mandat.organeRef, mandat.qualite,
                mandat.legislature, mandat.dateDebut, mandat.dateFin, mandat.preseance,
            ]
        );
        return rows[0];
    }

    static async upsertMany (mandats) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const mandat of mandats) {
                await MandatGouvernement.upsert(mandat);
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
