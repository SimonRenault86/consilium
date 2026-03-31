import pool from '../dbManager.js';

export default class Acteur {
    static async findAll () {
        const { rows } = await pool.query('SELECT * FROM acteurs ORDER BY nom, prenom');
        return rows;
    }

    static async findById (id) {
        const { rows } = await pool.query('SELECT * FROM acteurs WHERE id = $1', [id]);
        return rows[0] || null;
    }

    static async upsert (acteur) {
        const { rows } = await pool.query(
            `INSERT INTO acteurs (
                id, civ, nom, prenom, alpha, trigramme,
                naissance, ville_naissance, dep_naissance, pays_naissance, date_deces,
                profession, uri_hatvp,
                mail, twitter, facebook, instagram, linkedin, site_internet,
                updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11,
                $12, $13,
                $14, $15, $16, $17, $18, $19,
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                civ             = EXCLUDED.civ,
                nom             = EXCLUDED.nom,
                prenom          = EXCLUDED.prenom,
                alpha           = EXCLUDED.alpha,
                trigramme       = EXCLUDED.trigramme,
                naissance       = EXCLUDED.naissance,
                ville_naissance = EXCLUDED.ville_naissance,
                dep_naissance   = EXCLUDED.dep_naissance,
                pays_naissance  = EXCLUDED.pays_naissance,
                date_deces      = EXCLUDED.date_deces,
                profession      = EXCLUDED.profession,
                uri_hatvp       = EXCLUDED.uri_hatvp,
                mail            = EXCLUDED.mail,
                twitter         = EXCLUDED.twitter,
                facebook        = EXCLUDED.facebook,
                instagram       = EXCLUDED.instagram,
                linkedin        = EXCLUDED.linkedin,
                site_internet   = EXCLUDED.site_internet,
                updated_at      = NOW()
            RETURNING *`,
            [
                acteur.id, acteur.civ, acteur.nom, acteur.prenom, acteur.alpha, acteur.trigramme,
                acteur.naissance, acteur.villeNaissance, acteur.depNaissance, acteur.paysNaissance, acteur.dateDeces,
                acteur.profession, acteur.uriHatvp,
                acteur.mail, acteur.twitter, acteur.facebook, acteur.instagram, acteur.linkedin, acteur.siteInternet,
            ]
        );
        return rows[0];
    }

    static async upsertMany (acteurs) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const acteur of acteurs) {
                await Acteur.upsert(acteur);
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
