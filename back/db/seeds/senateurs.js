import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from '../dbManager.js';
import Senateur from '../models/Senateur.js';
import { logSeed } from './helpers/logSeed.js';
import { parseMandatsSenat } from './helpers/parseActeurs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ACTEURS_DIR = path.join(__dirname, '../../../tmp/json 8/acteur');

const run = async () => {
    try {
        const files = readdirSync(ACTEURS_DIR).filter(f => f.endsWith('.json'));
        console.log(`Lecture de ${files.length} fichiers acteurs...`);

        const senateurs = [];
        for (const file of files) {
            const raw = JSON.parse(readFileSync(path.join(ACTEURS_DIR, file), 'utf-8'));
            senateurs.push(...parseMandatsSenat(raw));
        }

        console.log(`Import de ${senateurs.length} mandats sénat...`);
        await Senateur.upsertMany(senateurs);
        console.log('Import des sénateurs terminé.');
        await logSeed('senateurs');
    } catch (err) {
        console.error('Erreur lors du seed senateurs :', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

run();
