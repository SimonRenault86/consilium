import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from '../dbManager.js';
import MandatGouvernement from '../models/MandatGouvernement.js';
import { logSeed } from './helpers/logSeed.js';
import { parseMandatsGouvernement } from './helpers/parseActeurs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ACTEURS_DIR = path.join(__dirname, '../../../tmp/json 8/acteur');

const run = async () => {
    try {
        const files = readdirSync(ACTEURS_DIR).filter(f => f.endsWith('.json'));
        console.log(`Lecture de ${files.length} fichiers acteurs...`);

        const mandats = [];
        for (const file of files) {
            const raw = JSON.parse(readFileSync(path.join(ACTEURS_DIR, file), 'utf-8'));
            mandats.push(...parseMandatsGouvernement(raw));
        }

        console.log(`Import de ${mandats.length} mandats gouvernement...`);
        await MandatGouvernement.upsertMany(mandats);
        console.log('Import des mandats gouvernement terminé.');
        await logSeed('ministres');
    } catch (err) {
        console.error('Erreur lors du seed ministres :', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

run();
