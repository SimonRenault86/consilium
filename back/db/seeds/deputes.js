import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from '../dbManager.js';
import Depute from '../models/Depute.js';
import { logSeed } from './helpers/logSeed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deputesBrut = JSON.parse(
    readFileSync(path.join(__dirname, '../../../front/helpers/brut/deputes.json'), 'utf-8')
);

const run = async () => {
    try {
        console.log(`Import de ${deputesBrut.length} députés...`);
        await Depute.upsertMany(deputesBrut);
        console.log('Import des députés terminé.');
        await logSeed('deputes');
    } catch (err) {
        console.error('Erreur lors du seed deputes :', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

run();
