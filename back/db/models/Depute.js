import pool from '../dbManager.js';

export default class Depute {
    // Retourne tous les députés
    static async findAll() {
        const { rows } = await pool.query('SELECT * FROM deputes ORDER BY nom, prenom');
        return rows;
    }

    // Retourne un député par son id (ex: "PA1008")
    static async findById(id) {
        const { rows } = await pool.query('SELECT * FROM deputes WHERE id = $1', [id]);
        return rows[0] || null;
    }

    // Retourne tous les députés d'un groupe politique (ex: "SOC")
    static async findByGroupe(groupeAbrev) {
        const { rows } = await pool.query(
            'SELECT * FROM deputes WHERE groupe_abrev = $1 ORDER BY nom, prenom',
            [groupeAbrev]
        );
        return rows;
    }

    // Retourne tous les députés d'un département (ex: "33")
    static async findByDepartement(departementCode) {
        const { rows } = await pool.query(
            'SELECT * FROM deputes WHERE departement_code = $1 ORDER BY circo',
            [departementCode]
        );
        return rows;
    }

    // Insère ou met à jour un député (upsert sur l'id)
    static async upsert(depute) {
        const { rows } = await pool.query(
            `INSERT INTO deputes (
                id, legislature, civ, nom, prenom, ville_naissance, naissance, age,
                groupe, groupe_abrev, departement_nom, departement_code, circo,
                date_prise_fonction, job, mail, twitter, facebook, website,
                nombre_mandats, experience_depute, score_participation,
                score_participation_specialite, score_loyaute, score_majorite,
                date_maj, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19,
                $20, $21, $22,
                $23, $24, $25,
                $26, NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                legislature                     = EXCLUDED.legislature,
                civ                             = EXCLUDED.civ,
                nom                             = EXCLUDED.nom,
                prenom                          = EXCLUDED.prenom,
                ville_naissance                 = EXCLUDED.ville_naissance,
                naissance                       = EXCLUDED.naissance,
                age                             = EXCLUDED.age,
                groupe                          = EXCLUDED.groupe,
                groupe_abrev                    = EXCLUDED.groupe_abrev,
                departement_nom                 = EXCLUDED.departement_nom,
                departement_code                = EXCLUDED.departement_code,
                circo                           = EXCLUDED.circo,
                date_prise_fonction             = EXCLUDED.date_prise_fonction,
                job                             = EXCLUDED.job,
                mail                            = EXCLUDED.mail,
                twitter                         = EXCLUDED.twitter,
                facebook                        = EXCLUDED.facebook,
                website                         = EXCLUDED.website,
                nombre_mandats                  = EXCLUDED.nombre_mandats,
                experience_depute               = EXCLUDED.experience_depute,
                score_participation             = EXCLUDED.score_participation,
                score_participation_specialite  = EXCLUDED.score_participation_specialite,
                score_loyaute                   = EXCLUDED.score_loyaute,
                score_majorite                  = EXCLUDED.score_majorite,
                date_maj                        = EXCLUDED.date_maj,
                updated_at                      = NOW()
            RETURNING *`,
            [
                depute.id, depute.legislature, depute.civ, depute.nom, depute.prenom,
                depute.villeNaissance, depute.naissance, depute.age,
                depute.groupe, depute.groupeAbrev, depute.departementNom, depute.departementCode, depute.circo,
                depute.datePriseFonction, depute.job, depute.mail, depute.twitter, depute.facebook, depute.website,
                depute.nombreMandats, depute.experienceDepute, depute.scoreParticipation,
                depute.scoreParticipationSpecialite, depute.scoreLoyaute, depute.scoreMajorite,
                depute.dateMaj,
            ]
        );
        return rows[0];
    }

    // Insère ou met à jour plusieurs députés en une seule transaction
    static async upsertMany(deputes) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const depute of deputes) {
                await Depute.upsert(depute);
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
