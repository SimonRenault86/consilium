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
        a.uri_hatvp                     AS hatvp_url,
        dt.nombre_mandats,
        dt.experience_depute,
        dt.place_hemicycle,
        dt.region,
        dt.cause_mandat,
        dt.premiere_election,
        dt.collaborateurs,
        dt.date_maj,
        dt.created_at,
        dt.updated_at,
        COALESCE(sh_men.score_participation_mensuelle, sh_an.score_participation) AS score_participation,
        sh_an.score_participation_specialite,
        sh_an.score_loyaute,
        sh_an.score_majorite
    FROM deputes dt
    JOIN acteurs a ON a.id = dt.id
    LEFT JOIN LATERAL (
        SELECT score_participation, score_participation_specialite, score_loyaute, score_majorite
        FROM deputes_scores_history
        WHERE id_depute = dt.id
          AND (score_participation IS NOT NULL OR score_loyaute IS NOT NULL
               OR score_participation_specialite IS NOT NULL OR score_majorite IS NOT NULL)
        ORDER BY date_maj DESC
        LIMIT 1
    ) sh_an ON true
    LEFT JOIN LATERAL (
        SELECT score_participation_mensuelle
        FROM deputes_scores_history
        WHERE id_depute = dt.id AND score_participation_mensuelle IS NOT NULL
        ORDER BY date_maj DESC
        LIMIT 1
    ) sh_men ON true
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

    static async findCommissionsByDepute (id) {
        const { rows } = await pool.query(
            'SELECT nom, role FROM deputes_commissions WHERE id_depute = $1',
            [id]
        );
        return rows;
    }

    static async upsertCommissions (idDepute, commissions, client) {
        const db = client || pool;
        await db.query('DELETE FROM deputes_commissions WHERE id_depute = $1', [idDepute]);
        for (const c of commissions) {
            await db.query(
                'INSERT INTO deputes_commissions (id_depute, nom, role) VALUES ($1, $2, $3)',
                [idDepute, c.nom, c.role || 'Membre']
            );
        }
    }

    static async upsert (depute) {
        const { rows } = await pool.query(
            `INSERT INTO deputes (
                id, legislature, groupe, groupe_abrev,
                departement_nom, departement_code, circo,
                date_prise_fonction, job,
                nombre_mandats, experience_depute,
                place_hemicycle, region, cause_mandat, premiere_election, collaborateurs,
                date_maj, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14, $15, $16, $17, NOW()
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
                place_hemicycle                 = EXCLUDED.place_hemicycle,
                region                          = EXCLUDED.region,
                cause_mandat                    = EXCLUDED.cause_mandat,
                premiere_election               = EXCLUDED.premiere_election,
                collaborateurs                  = EXCLUDED.collaborateurs,
                date_maj                        = EXCLUDED.date_maj,
                updated_at                      = NOW()
            RETURNING *`,
            [
                depute.id, depute.legislature, depute.groupe, depute.groupeAbrev,
                depute.departementNom, depute.departementCode, depute.circo,
                depute.datePriseFonction, depute.job,
                depute.nombreMandats, depute.experienceDepute,
                depute.placeHemicycle ?? null, depute.region ?? null,
                depute.causeMandat ?? null, depute.premiereElection ?? false,
                depute.collaborateurs ?? null,
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

    static parse (row) {
        const mandatPrincipal = (row.region || row.cause_mandat || row.place_hemicycle || row.collaborateurs)
            ? {
                legislature: row.legislature,
                region: row.region ?? null,
                causeMandat: row.cause_mandat ?? null,
                placeHemicycle: row.place_hemicycle ?? null,
                premiereElection: row.premiere_election ?? false,
                collaborateurs: row.collaborateurs ?? [],
            }
            : null;

        return {
            id: row.id,
            legislature: row.legislature,
            civ: row.civ,
            nom: row.nom,
            prenom: row.prenom,
            villeNaissance: row.ville_naissance,
            naissance: row.naissance,
            age: row.age,
            groupe: row.groupe,
            groupeAbrev: row.groupe_abrev,
            departementNom: row.departement_nom,
            departementCode: row.departement_code,
            circo: row.circo,
            datePriseFonction: row.date_prise_fonction,
            job: row.job,
            mail: row.mail,
            twitter: row.twitter,
            facebook: row.facebook,
            website: row.website,
            hatvpUrl: row.hatvp_url,
            nombreMandats: row.nombre_mandats,
            experienceDepute: row.experience_depute,
            scoreParticipation: row.score_participation != null ? parseFloat(row.score_participation) : null,
            scoreParticipationSpecialite: row.score_participation_specialite != null ? parseFloat(row.score_participation_specialite) : null,
            scoreLoyaute: row.score_loyaute != null ? parseFloat(row.score_loyaute) : null,
            scoreMajorite: row.score_majorite != null ? parseFloat(row.score_majorite) : null,
            mandatPrincipal,
        };
    }
}
