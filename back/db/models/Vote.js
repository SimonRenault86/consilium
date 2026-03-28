import pool from '../dbManager.js';

export default class Vote {
    static async findAll ({ from, to, limit = 10, q } = {}) {
        const conditions = [];
        const params = [];

        if (from) { params.push(from); conditions.push(`date_scrutin >= $${params.length}`); }
        if (to) { params.push(to); conditions.push(`date_scrutin <= $${params.length}`); }
        if (q) { params.push(`%${q.toLowerCase()}%`); conditions.push(`LOWER(titre) LIKE $${params.length}`); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        params.push(Math.min(limit, 200));

        const { rows } = await pool.query(
            `SELECT * FROM votes ${where} ORDER BY numero DESC LIMIT $${params.length}`,
            params
        );
        return rows;
    }

    static async findByUid (uid) {
        const { rows } = await pool.query('SELECT * FROM votes WHERE uid = $1', [uid]);
        return rows[0] || null;
    }

    // Retourne le vote + la map acteurRef → position
    static async findByUidWithVotants (uid) {
        const [voteResult, votantsResult] = await Promise.all([
            pool.query('SELECT * FROM votes WHERE uid = $1', [uid]),
            pool.query('SELECT id_depute, position FROM deputes_votes WHERE id_vote = $1', [uid]),
        ]);
        const vote = voteResult.rows[0];
        if (!vote) return null;

        const votantsMap = {};
        for (const row of votantsResult.rows) votantsMap[row.id_depute] = row.position;

        return { ...vote, votantsMap };
    }

    static async upsert (vote) {
        await pool.query(
            `INSERT INTO votes (uid, numero, legislature, date_scrutin, titre, sort, demandeur,
                type_vote, type_majorite, nb_votants, suffrages_exprimes, nb_suffrage_requis,
                nb_pour, nb_contre, nb_abstentions, nb_non_votants)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            ON CONFLICT (uid) DO UPDATE SET
                titre               = EXCLUDED.titre,
                sort                = EXCLUDED.sort,
                demandeur           = EXCLUDED.demandeur,
                type_vote           = EXCLUDED.type_vote,
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
                vote.type_vote, vote.type_majorite,
                vote.nb_votants, vote.suffrages_exprimes, vote.nb_suffrage_requis,
                vote.nb_pour, vote.nb_contre, vote.nb_abstentions, vote.nb_non_votants,
            ]
        );
    }
}
