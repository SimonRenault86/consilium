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
        ALTER TABLE qags ADD COLUMN IF NOT EXISTS qag_categorie_id INTEGER REFERENCES scrutin_categories(id);
        ALTER TABLE qags ADD COLUMN IF NOT EXISTS qag_sous_categorie_id INTEGER REFERENCES scrutin_sous_categories(id);
    `);

    const { rows: qags } = await pool.query(
        `SELECT uid, rubrique, sujet
         FROM qags
         WHERE qag_categorie_id IS NULL AND code_cloture = 'REP_PUB'
         ORDER BY date_seance DESC`
    );

    console.log(`${qags.length} QaGs à catégoriser.`);

    if (qags.length === 0) {
        console.log('Rien à faire.');
        await logSeed('categorise-qags');
        return;
    }

    // Transformer chaque QaG en { uid, titre } pour réutiliser categoriseVotes
    const items = qags.map(q => {
        const rubrique = q.rubrique || '';
        const sujet = q.sujet || '';
        const titre = [rubrique, sujet].filter(Boolean).join(' — ');
        return { uid: q.uid, titre: titre || `QaG ${q.uid}` };
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
                    `UPDATE qags
                     SET qag_categorie_id = data.cat_id,
                         qag_sous_categorie_id = data.sous_id
                     FROM unnest($1::text[], $2::int[], $3::int[]) AS data(uid, cat_id, sous_id)
                     WHERE qags.uid = data.uid`,
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

    console.log(`Catégorisation terminée : ${done} QaGs mis à jour, ${errors} erreur(s) de batch.`);
    await logSeed('categorise-qags');
};

run().finally(() => pool.end());
