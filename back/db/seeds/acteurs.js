import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from '../dbManager.js';
import Acteur from '../models/Acteur.js';
import { logSeed } from './helpers/logSeed.js';
import { parseActeur } from './helpers/parseActeurs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ACTEURS_DIR = path.join(__dirname, '../../../tmp/json 8/acteur');

const run = async () => {
    try {
        const files = readdirSync(ACTEURS_DIR).filter(f => f.endsWith('.json'));
        console.log(`Lecture de ${files.length} fichiers acteurs...`);

        const acteurs = [];
        for (const file of files) {
            const raw = JSON.parse(readFileSync(path.join(ACTEURS_DIR, file), 'utf-8'));
            const acteur = parseActeur(raw);
            if (acteur.nom && acteur.prenom) acteurs.push(acteur);
        }

        console.log(`Import de ${acteurs.length} acteurs...`);
        await Acteur.upsertMany(acteurs);
        console.log('Import des acteurs terminé.');
        await logSeed('acteurs');
    } catch (err) {
        console.error('Erreur lors du seed acteurs :', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

run();
