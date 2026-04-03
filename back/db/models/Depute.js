import pool from '../dbManager.js';

// Projection commune : retourne exactement les mêmes colonnes que l'ancienne table deputes
// pour garantir la compatibilité avec les routes et vues existantes.
const SELECT_DEPUTE = `
    SELECT
        dt.id,
        dt.legislature,
        a.civ,
        a.nom,
        a.prenom,
        a.ville_naissance,
        a.naissance,
        DATE_PART('year', AGE(a.naissance))::INTEGER AS age,
        dt.groupe,
        dt.groupe_abrev,
        dt.departement_nom,
        dt.departement_code,
        dt.circo,
        dt.date_prise_fonction,
        dt.job,
        a.mail,
        a.twitter,
        a.facebook,
        a.site_internet                 AS website,
        dt.nombre_mandats,
        dt.experience_depute,
        dt.date_maj,
        dt.created_at,
        dt.updated_at,
        sh.score_participation,
        sh.score_participation_specialite,
        sh.score_loyaute,
        sh.score_majorite
    FROM deputes dt
    JOIN acteurs a ON a.id = dt.id
    LEFT JOIN LATERAL (
        SELECT score_participation, score_participation_specialite, score_loyaute, score_majorite
        FROM deputes_scores_history
        WHERE id_depute = dt.id
        ORDER BY date_maj DESC
        LIMIT 1
    ) sh ON true
`;

export default class Depute {
    static async findAll () {
        const { rows } = await pool.query(`${SELECT_DEPUTE} ORDER BY a.nom, a.prenom`);
        return rows;
    }

    static async findById (id) {
        const { rows } = await pool.query(
            `${SELECT_DEPUTE} WHERE dt.id = $1`,
            [id]
        );
        return rows[0] || null;
    }

    static async findBySlug (slug) {
        const { rows } = await pool.query(
            `${SELECT_DEPUTE}
            WHERE lower(regexp_replace(regexp_replace(unaccent(a.prenom || ' ' || a.nom), '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g')) = $1`,
            [slug]
        );
        return rows[0] || null;
    }

    static async findByGroupe (groupeAbrev) {
        const { rows } = await pool.query(
            `${SELECT_DEPUTE} WHERE dt.groupe_abrev = $1 ORDER BY a.nom, a.prenom`,
            [groupeAbrev]
        );
        return rows;
    }

    static async findByDepartement (departementCode) {
        const { rows } = await pool.query(
            `${SELECT_DEPUTE} WHERE dt.departement_code = $1 ORDER BY dt.circo`,
            [departementCode]
        );
        return rows;
    }

    static async upsert (depute) {
        const { rows } = await pool.query(
            `INSERT INTO deputes (
                id, legislature, groupe, groupe_abrev,
                departement_nom, departement_code, circo,
                date_prise_fonction, job,
                nombre_mandats, experience_depute,
                date_maj, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                legislature                     = EXCLUDED.legislature,
                groupe                          = EXCLUDED.groupe,
                groupe_abrev                    = EXCLUDED.groupe_abrev,
                departement_nom                 = EXCLUDED.departement_nom,
                departement_code                = EXCLUDED.departement_code,
                circo                           = EXCLUDED.circo,
                date_prise_fonction             = EXCLUDED.date_prise_fonction,
                job                             = EXCLUDED.job,
                nombre_mandats                  = EXCLUDED.nombre_mandats,
                experience_depute               = EXCLUDED.experience_depute,
                date_maj                        = EXCLUDED.date_maj,
                updated_at                      = NOW()
            RETURNING *`,
            [
                depute.id, depute.legislature, depute.groupe, depute.groupeAbrev,
                depute.departementNom, depute.departementCode, depute.circo,
                depute.datePriseFonction, depute.job,
                depute.nombreMandats, depute.experienceDepute,
                depute.dateMaj,
            ]
        );
        return rows[0];
    }

    static async upsertMany (deputes) {
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
