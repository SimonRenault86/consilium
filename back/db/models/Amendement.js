import pool from '../dbManager.js';

export default class Amendement {
    static async findAll ({ from, to, limit = 10, q, sort } = {}) {
        const conditions = [];
        const params = [];

        if (from) { params.push(from); conditions.push(`a.date_depot >= $${params.length}`); }
        if (to) { params.push(to); conditions.push(`a.date_depot <= $${params.length}`); }
        if (q) {
            params.push(`%${q.toLowerCase()}%`);
            conditions.push(`(LOWER(a.article_titre) LIKE $${params.length} OR LOWER(a.dispositif) LIKE $${params.length} OR LOWER(a.numero_long) LIKE $${params.length})`);
        }
        if (sort) { params.push(sort); conditions.push(`LOWER(a.sort) = LOWER($${params.length})`); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        params.push(Math.min(limit, 200));

        const { rows } = await pool.query(
            `SELECT a.*,
                d.prenom AS auteur_prenom,
                d.nom AS auteur_nom,
                d.groupe_abrev AS auteur_groupe,
                sc.nom AS sous_categorie_nom,
                COALESCE(c2.nom, c1.nom) AS categorie_nom,
                COALESCE(c2.couleur, c1.couleur) AS categorie_couleur
            FROM amendements a
            LEFT JOIN deputes d ON d.id = a.auteur_ref
            LEFT JOIN scrutin_categories c1 ON c1.id = a.amendement_categorie_id
            LEFT JOIN scrutin_sous_categories sc ON sc.id = a.amendement_sous_categorie_id
            LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
            ${where}
            ORDER BY a.date_depot DESC, a.numero_ordre_depot DESC
            LIMIT $${params.length}`,
            params
        );
        return rows;
    }

    static async findByUid (uid) {
        const { rows } = await pool.query(
            `SELECT a.*,
                d.prenom AS auteur_prenom,
                d.nom AS auteur_nom,
                d.groupe_abrev AS auteur_groupe,
                sc.nom AS sous_categorie_nom,
                COALESCE(c2.nom, c1.nom) AS categorie_nom,
                COALESCE(c2.couleur, c1.couleur) AS categorie_couleur
            FROM amendements a
            LEFT JOIN deputes d ON d.id = a.auteur_ref
            LEFT JOIN scrutin_categories c1 ON c1.id = a.amendement_categorie_id
            LEFT JOIN scrutin_sous_categories sc ON sc.id = a.amendement_sous_categorie_id
            LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
            WHERE a.uid = $1`,
            [uid]
        );
        return rows[0] || null;
    }

    static async findByUidWithSignataires (uid) {
        const [amendementResult, signatairesResult] = await Promise.all([
            pool.query(
                `SELECT a.*,
                    d.prenom AS auteur_prenom,
                    d.nom AS auteur_nom,
                    d.groupe_abrev AS auteur_groupe,
                    sc.nom AS sous_categorie_nom,
                    COALESCE(c2.nom, c1.nom) AS categorie_nom,
                    COALESCE(c2.couleur, c1.couleur) AS categorie_couleur
                FROM amendements a
                LEFT JOIN deputes d ON d.id = a.auteur_ref
                LEFT JOIN scrutin_categories c1 ON c1.id = a.amendement_categorie_id
                LEFT JOIN scrutin_sous_categories sc ON sc.id = a.amendement_sous_categorie_id
                LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
                WHERE a.uid = $1`,
                [uid]
            ),
            pool.query(
                'SELECT id_depute, role FROM deputes_amendements WHERE id_amendement = $1',
                [uid]
            ),
        ]);
        const amendement = amendementResult.rows[0];
        if (!amendement) return null;

        const signatairesMap = {};
        for (const row of signatairesResult.rows) {
            signatairesMap[row.id_depute] = row.role;
        }

        return { ...amendement, signatairesMap };
    }

    static async upsert (amendement) {
        await pool.query(
            `INSERT INTO amendements (uid, legislature, numero_long, numero_ordre_depot,
                texte_legislatif_ref, auteur_ref, groupe_politique_ref,
                article_titre, article_designation, dispositif, expose_sommaire,
                date_depot, date_publication, sort, etat, sous_etat)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            ON CONFLICT (uid) DO UPDATE SET
                sort                = EXCLUDED.sort,
                etat                = EXCLUDED.etat,
                sous_etat           = EXCLUDED.sous_etat,
                date_publication    = EXCLUDED.date_publication,
                dispositif          = EXCLUDED.dispositif,
                expose_sommaire     = EXCLUDED.expose_sommaire`,
            [
                amendement.uid, amendement.legislature, amendement.numero_long,
                amendement.numero_ordre_depot, amendement.texte_legislatif_ref,
                amendement.auteur_ref, amendement.groupe_politique_ref,
                amendement.article_titre, amendement.article_designation,
                amendement.dispositif, amendement.expose_sommaire,
                amendement.date_depot, amendement.date_publication,
                amendement.sort, amendement.etat, amendement.sous_etat,
            ]
        );
    }
}
