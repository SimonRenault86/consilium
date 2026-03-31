import 'dotenv/config';
import pool from '../dbManager.js';
import { logSeed } from './helpers/logSeed.js';
import { categoriseVotes, OPENAI_BATCH_SIZE } from './helpers/categorise.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const run = async () => {
    if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY manquant dans .env');
        process.exit(1);
    }

    // Reset uniquement les catégories — les scrutins ne sont pas touchés
    console.log('Reset des catégories...');
    await pool.query('UPDATE scrutins SET scrutin_categorie_id = NULL, scrutin_sous_categorie_id = NULL');
    await pool.query('DELETE FROM scrutin_sous_categories');
    await pool.query('DELETE FROM scrutin_categories');
    await pool.query('ALTER SEQUENCE scrutin_categories_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE scrutin_sous_categories_id_seq RESTART WITH 1');
    console.log('Reset terminé.');

    const { rows: votes } = await pool.query(
        'SELECT uid, titre FROM scrutins WHERE scrutin_categorie_id IS NULL ORDER BY numero'
    );

    console.log(`${votes.length} scrutins à catégoriser.`);

    if (votes.length === 0) {
        console.log('Rien à faire.');
        return;
    }

    let done = 0;
    let errors = 0;

    for (let i = 0; i < votes.length; i += OPENAI_BATCH_SIZE) {
        const batch = votes.slice(i, i + OPENAI_BATCH_SIZE);
        try {
            const catMap = await categoriseVotes(batch);
            const entries = Object.entries(catMap);
            if (entries.length > 0) {
                // Update groupé en une seule requête via unnest
                const uids = entries.map(([uid]) => uid);
                const catIds = entries.map(([, v]) => v.categorieId);
                const sousIds = entries.map(([, v]) => v.sousCategorieId || null);
                await pool.query(
                    `UPDATE scrutins SET scrutin_categorie_id = data.cat_id, scrutin_sous_categorie_id = data.sous_id
                    FROM unnest($1::text[], $2::int[], $3::int[]) AS data(uid, cat_id, sous_id)
                    WHERE scrutins.uid = data.uid`,
                    [uids, catIds, sousIds]
                );
                done += entries.length;
            }
        } catch (e) {
            errors++;
            console.error(`Erreur batch ${Math.floor(i / OPENAI_BATCH_SIZE) + 1} :`, e.message);
        }

        console.log(`  ${Math.min(i + OPENAI_BATCH_SIZE, votes.length)}/${votes.length} traités...`);

        if (i + OPENAI_BATCH_SIZE < votes.length) await sleep(200);
    }

    console.log(`Catégorisation terminée : ${done} scrutins mis à jour, ${errors} erreur(s) de batch.`);
    await logSeed('categorise-scrutins');
};

run().finally(() => pool.end());
