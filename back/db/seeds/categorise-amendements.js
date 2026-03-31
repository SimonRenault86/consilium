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

    // S'assurer que les colonnes catégories existent
    await pool.query(`
        ALTER TABLE amendements ADD COLUMN IF NOT EXISTS amendement_categorie_id INTEGER REFERENCES scrutin_categories(id);
        ALTER TABLE amendements ADD COLUMN IF NOT EXISTS amendement_sous_categorie_id INTEGER REFERENCES scrutin_sous_categories(id);
    `);

    const { rows: amendements } = await pool.query(
        `SELECT uid, article_titre, dispositif, expose_sommaire
         FROM amendements
         WHERE amendement_categorie_id IS NULL AND sort IS NOT NULL
         ORDER BY date_depot DESC`
    );

    console.log(`${amendements.length} amendements à catégoriser.`);

    if (amendements.length === 0) {
        console.log('Rien à faire.');
        return;
    }

    // Transformer chaque amendement en un objet { uid, titre } pour réutiliser categoriseVotes
    // Le "titre" combine article + extrait du dispositif pour donner du contexte à OpenAI
    const items = amendements.map(a => {
        const article = a.article_titre || '';
        const dispositif = (a.dispositif || '')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 200);
        const titre = [article, dispositif].filter(Boolean).join(' — ');
        return { uid: a.uid, titre: titre || `Amendement ${a.uid}` };
    });

    let done = 0;
    let errors = 0;

    for (let i = 0; i < items.length; i += OPENAI_BATCH_SIZE) {
        const batch = items.slice(i, i + OPENAI_BATCH_SIZE);
        try {
            const catMap = await categoriseVotes(batch);
            const entries = Object.entries(catMap);
            if (entries.length > 0) {
                const uids = entries.map(([uid]) => uid);
                const catIds = entries.map(([, v]) => v.categorieId);
                const sousIds = entries.map(([, v]) => v.sousCategorieId || null);
                await pool.query(
                    `UPDATE amendements
                     SET amendement_categorie_id = data.cat_id,
                         amendement_sous_categorie_id = data.sous_id
                     FROM unnest($1::text[], $2::int[], $3::int[]) AS data(uid, cat_id, sous_id)
                     WHERE amendements.uid = data.uid`,
                    [uids, catIds, sousIds]
                );
                done += entries.length;
            }
        } catch (e) {
            errors++;
            console.error(`Erreur batch ${Math.floor(i / OPENAI_BATCH_SIZE) + 1} :`, e.message);
        }

        console.log(`  ${Math.min(i + OPENAI_BATCH_SIZE, items.length)}/${items.length} traités...`);

        if (i + OPENAI_BATCH_SIZE < items.length) await sleep(200);
    }

    console.log(`Catégorisation terminée : ${done} amendements mis à jour, ${errors} erreur(s) de batch.`);
    await logSeed('categorise-amendements');
};

run().finally(() => pool.end());
