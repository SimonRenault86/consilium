import pool from '../dbManager.js';

export default class Vote {
    static async findAll ({ from, to, limit = 10, q, groupes, categories } = {}) {
        const conditions = [];
        const params = [];

        if (from) { params.push(from); conditions.push(`v.date_scrutin >= $${params.length}`); }
        if (to) { params.push(to); conditions.push(`v.date_scrutin <= $${params.length}`); }
        if (q) { params.push(`%${q.toLowerCase()}%`); conditions.push(`LOWER(v.titre) LIKE $${params.length}`); }
        if (categories && categories.length) {
            params.push(categories);
            conditions.push(`COALESCE(c2.nom, c1.nom) = ANY($${params.length}::text[])`);
        }
        if (groupes && groupes.length) {
            params.push(groupes);
            conditions.push(`EXISTS (SELECT 1 FROM deputes_votes dv2 JOIN deputes d2 ON d2.id = dv2.id_depute WHERE dv2.id_vote = v.uid AND d2.groupe_abrev = ANY($${params.length}::text[]))`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        params.push(Math.min(limit, 200));

        const { rows } = await pool.query(
            `SELECT v.*,
                sc.nom AS sous_categorie_nom,
                COALESCE(c2.nom, c1.nom) AS categorie_nom,
                COALESCE(c2.couleur, c1.couleur) AS categorie_couleur
            FROM scrutins v
            LEFT JOIN scrutin_categories c1 ON c1.id = v.scrutin_categorie_id
            LEFT JOIN scrutin_sous_categories sc ON sc.id = v.scrutin_sous_categorie_id
            LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
            ${where} ORDER BY v.numero DESC LIMIT $${params.length}`,
            params
        );
        return rows;
    }

    static async findByUid (uid) {
        const { rows } = await pool.query(
            `SELECT v.*,
                sc.nom AS sous_categorie_nom,
                COALESCE(c2.nom, c1.nom) AS categorie_nom,
                COALESCE(c2.couleur, c1.couleur) AS categorie_couleur
            FROM scrutins v
            LEFT JOIN scrutin_categories c1 ON c1.id = v.scrutin_categorie_id
            LEFT JOIN scrutin_sous_categories sc ON sc.id = v.scrutin_sous_categorie_id
            LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
            WHERE v.uid = $1`,
            [uid]
        );
        return rows[0] || null;
    }

    // Retourne le vote + la map acteurRef → position
    static async findByUidWithVotants (uid) {
        const [voteResult, votantsResult] = await Promise.all([
            pool.query(
                `SELECT v.*,
                    sc.nom AS sous_categorie_nom,
                    COALESCE(c2.nom, c1.nom) AS categorie_nom,
                    COALESCE(c2.couleur, c1.couleur) AS categorie_couleur
                FROM scrutins v
                LEFT JOIN scrutin_categories c1 ON c1.id = v.scrutin_categorie_id
                LEFT JOIN scrutin_sous_categories sc ON sc.id = v.scrutin_sous_categorie_id
                LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
                WHERE v.uid = $1`,
                [uid]
            ),
            pool.query('SELECT id_depute, position FROM deputes_votes WHERE id_vote = $1', [uid]),
        ]);
        const vote = voteResult.rows[0];
        if (!vote) return null;

        const votantsMap = {};
        for (const row of votantsResult.rows) votantsMap[row.id_depute] = row.position;

        return { ...vote, votantsMap };
    }

    // Retourne uniquement uid + date_scrutin pour tous les scrutins (usage sitemap)
    static async findAllUids () {
        const { rows } = await pool.query(
            'SELECT uid, date_scrutin FROM scrutins ORDER BY numero DESC'
        );
        return rows;
    }

    static async upsert (vote) {
        await pool.query(
            `INSERT INTO scrutins (uid, numero, legislature, date_scrutin, titre, sort, demandeur,
                type_majorite, nb_votants, suffrages_exprimes, nb_suffrage_requis,
                nb_pour, nb_contre, nb_abstentions, nb_non_votants)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            ON CONFLICT (uid) DO UPDATE SET
                titre               = EXCLUDED.titre,
                sort                = EXCLUDED.sort,
                demandeur           = EXCLUDED.demandeur,
                type_majorite       = EXCLUDED.type_majorite,
                nb_votants          = EXCLUDED.nb_votants,
                suffrages_exprimes  = EXCLUDED.suffrages_exprimes,
                nb_suffrage_requis  = EXCLUDED.nb_suffrage_requis,
                nb_pour             = EXCLUDED.nb_pour,
                nb_contre           = EXCLUDED.nb_contre,
                nb_abstentions      = EXCLUDED.nb_abstentions,
                nb_non_votants      = EXCLUDED.nb_non_votants`,
            [
                vote.uid, vote.numero, vote.legislature, vote.date_scrutin,
                vote.titre, vote.sort, vote.demandeur,
                vote.type_majorite,
                vote.nb_votants, vote.suffrages_exprimes, vote.nb_suffrage_requis,
                vote.nb_pour, vote.nb_contre, vote.nb_abstentions, vote.nb_non_votants,
            ]
        );
    }

    // Retourne les derniers scrutins avec le décompte de votes du groupe
    static async findByGroupe (groupeAbrev, { limit = 20 } = {}) {
        const { rows } = await pool.query(
            `SELECT v.uid, v.numero, v.titre, v.sort, v.date_scrutin,
                    COALESCE(c2.nom, c1.nom) AS categorie_nom,
                    COALESCE(c2.couleur, c1.couleur) AS categorie_couleur,
                    COUNT(dv.id_depute) FILTER (WHERE dv.position = 'pour') AS groupe_pour,
                    COUNT(dv.id_depute) FILTER (WHERE dv.position = 'contre') AS groupe_contre,
                    COUNT(dv.id_depute) FILTER (WHERE dv.position = 'abstention') AS groupe_abstentions,
                    v.nb_votants, v.nb_pour, v.nb_contre, v.nb_abstentions
             FROM scrutins v
             JOIN deputes_votes dv ON dv.id_vote = v.uid
             JOIN deputes d ON d.id = dv.id_depute AND d.groupe_abrev = $1
             LEFT JOIN scrutin_categories c1 ON c1.id = v.scrutin_categorie_id
             LEFT JOIN scrutin_sous_categories sc ON sc.id = v.scrutin_sous_categorie_id
             LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
             GROUP BY v.uid, v.numero, v.titre, v.sort, v.date_scrutin,
                      categorie_nom, categorie_couleur,
                      v.nb_votants, v.nb_pour, v.nb_contre, v.nb_abstentions
             ORDER BY v.numero DESC
             LIMIT $2`,
            [groupeAbrev, limit]
        );
        return rows;
    }

    // Retourne les stats de votes par catégorie pour un groupe
    static async findStatsByGroupe (groupeAbrev) {
        const { rows } = await pool.query(
            `SELECT
                    COALESCE(c2.nom, c1.nom) AS categorie,
                    COALESCE(c2.couleur, c1.couleur) AS couleur,
                    COUNT(DISTINCT v.uid) AS nb_scrutins,
                    COUNT(*) FILTER (WHERE dv.position = 'pour') AS nb_pour,
                    COUNT(*) FILTER (WHERE dv.position = 'contre') AS nb_contre,
                    COUNT(*) FILTER (WHERE dv.position = 'abstention') AS nb_abstentions,
                    (COUNT(DISTINCT v.uid) * (SELECT COUNT(*) FROM deputes WHERE groupe_abrev = $1)) - COUNT(*) AS nb_non_participation
             FROM deputes_votes dv
             JOIN scrutins v ON v.uid = dv.id_vote
             JOIN deputes d ON d.id = dv.id_depute AND d.groupe_abrev = $1
             LEFT JOIN scrutin_categories c1 ON c1.id = v.scrutin_categorie_id
             LEFT JOIN scrutin_sous_categories sc ON sc.id = v.scrutin_sous_categorie_id
             LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
             WHERE COALESCE(c2.nom, c1.nom) IS NOT NULL
             GROUP BY 1, 2
             ORDER BY nb_scrutins DESC`,
            [groupeAbrev]
        );
        return rows;
    }
}
