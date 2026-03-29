import pool from '../dbManager.js';

export default class DeputeVote {
    // Retourne tous les votes d'un député avec le détail du scrutin
    static async findByDepute (idDepute) {
        const { rows } = await pool.query(
            `SELECT dv.id_vote, dv.position,
                    v.numero, v.date_scrutin, v.titre, v.sort
             FROM deputes_votes dv
             JOIN scrutins v ON v.uid = dv.id_vote
             WHERE dv.id_depute = $1
             ORDER BY v.numero DESC`,
            [idDepute]
        );
        return rows;
    }

    // Stats agrégées + 5 derniers votes d'un député
    static async findStatsByDepute (idDepute) {
        const [statsResult, recentsResult, topCatResult, topSousCatResult] = await Promise.all([
            pool.query(
                `SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE position = 'pour') AS pour,
                    COUNT(*) FILTER (WHERE position = 'contre') AS contre,
                    COUNT(*) FILTER (WHERE position = 'abstention') AS abstentions,
                    (SELECT COUNT(*) FROM scrutins) - COUNT(*) AS non_participation
                 FROM deputes_votes
                 WHERE id_depute = $1`,
                [idDepute]
            ),
            pool.query(
                `SELECT dv.id_vote, dv.position,
                        v.numero, v.date_scrutin, v.titre, v.sort,
                        COALESCE(c2.nom, c1.nom) AS categorie_nom,
                        COALESCE(c2.couleur, c1.couleur) AS categorie_couleur
                 FROM deputes_votes dv
                 JOIN scrutins v ON v.uid = dv.id_vote
                 LEFT JOIN scrutin_categories c1 ON c1.id = v.scrutin_categorie_id
                 LEFT JOIN scrutin_sous_categories sc ON sc.id = v.scrutin_sous_categorie_id
                 LEFT JOIN scrutin_categories c2 ON c2.id = sc.categorie_id
                 WHERE dv.id_depute = $1
                 ORDER BY v.numero DESC
                 LIMIT 5`,
                [idDepute]
            ),
            pool.query(
                `SELECT c1.nom, c1.couleur, COUNT(*) AS nb
                 FROM deputes_votes dv
                 JOIN scrutins v ON v.uid = dv.id_vote
                 JOIN scrutin_categories c1 ON c1.id = v.scrutin_categorie_id
                 WHERE dv.id_depute = $1
                 GROUP BY c1.id, c1.nom, c1.couleur
                 ORDER BY nb DESC
                 LIMIT 3`,
                [idDepute]
            ),
            pool.query(
                `SELECT sc.nom, c1.couleur, COUNT(*) AS nb
                 FROM deputes_votes dv
                 JOIN scrutins v ON v.uid = dv.id_vote
                 JOIN scrutin_sous_categories sc ON sc.id = v.scrutin_sous_categorie_id
                 JOIN scrutin_categories c1 ON c1.id = sc.categorie_id
                 WHERE dv.id_depute = $1
                 GROUP BY sc.id, sc.nom, c1.couleur
                 ORDER BY nb DESC
                 LIMIT 3`,
                [idDepute]
            ),
        ]);
        const s = statsResult.rows[0];
        return {
            total: parseInt(s.total, 10),
            pour: parseInt(s.pour, 10),
            contre: parseInt(s.contre, 10),
            abstentions: parseInt(s.abstentions, 10),
            nonParticipation: parseInt(s.non_participation, 10),
            categoriesPrincipales: topCatResult.rows.map(r => ({ nom: r.nom, couleur: r.couleur })),
            sousCategoriesPrincipales: topSousCatResult.rows.map(r => ({ nom: r.nom, couleur: r.couleur })),
            derniersVotes: recentsResult.rows.map(v => ({
                uid: v.id_vote,
                numero: v.numero,
                titre: v.titre,
                sort: v.sort,
                position: v.position,
                categorie: v.categorie_nom ? { nom: v.categorie_nom, couleur: v.categorie_couleur } : null,
                dateScrutin: v.date_scrutin instanceof Date
                    ? v.date_scrutin.toISOString().slice(0, 10)
                    : String(v.date_scrutin).slice(0, 10),
            })),
        };
    }

    // Insère les positions de vote en bulk pour un scrutin donné
    // votants : [{ id_depute, position }]
    static async insertBulk (idVote, votants, client) {
        if (!votants.length) return;

        // Chunk de 500 lignes max pour rester sous la limite de 65535 paramètres PG
        const CHUNK = 500;
        for (let i = 0; i < votants.length; i += CHUNK) {
            const chunk = votants.slice(i, i + CHUNK);
            const values = chunk.map((_, j) => `($1, $${j * 2 + 2}, $${j * 2 + 3})`).join(', ');
            const params = [idVote, ...chunk.flatMap(v => [v.id_depute, v.position])];
            await client.query(
                `INSERT INTO deputes_votes (id_vote, id_depute, position)
                 VALUES ${values}
                 ON CONFLICT (id_vote, id_depute) DO UPDATE SET position = EXCLUDED.position`,
                params
            );
        }
    }
}
