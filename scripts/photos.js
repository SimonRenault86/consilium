import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import pool from '../back/db/dbManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deputesPath = path.join(__dirname, '../front/helpers/brut/deputes.json');
const outputDir = path.join(__dirname, '../public/elus');

function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPhoto (id, label) {
    const outputPath = path.join(outputDir, `${id}.jpg`);

    if (existsSync(outputPath)) {
        console.log(`Photo déjà présente pour ${label} (${id}), ignorée.`);
        return;
    }

    const numericId = id.replace('PA', '');
    const photoUrl = `https://www.assemblee-nationale.fr/dyn/static/tribun/17/photos/carre/${numericId}.jpg`;

    try {
        console.log(`Téléchargement: ${label}...`);
        const response = await fetch(photoUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        writeFileSync(outputPath, Buffer.from(buffer));
        console.log(`✓ Sauvegardée: ${outputPath}`);
    } catch (error) {
        console.error(`✗ Erreur pour ${label} (${id}): ${error.message}`);
    }
}

const args = process.argv.slice(2);
const isMinistres = args.includes('--ministres') || args.find(a => a.startsWith('--source='))?.split('=')[1] === 'ministres';
const targetId = args.find(a => !a.startsWith('--'));

if (targetId) {
    // Téléchargement d'un seul acteur par ID
    await fetchPhoto(targetId, targetId);
} else if (isMinistres) {
    // Ministres actuels depuis la DB
    const { rows } = await pool.query(
        `SELECT DISTINCT a.id, a.prenom, a.nom
         FROM mandats_gouvernement mg
         JOIN acteurs a ON a.id = mg.acteur_id
         WHERE mg.type_organe = 'MINISTERE' AND mg.date_fin IS NULL
         ORDER BY a.nom`
    );
    await pool.end();

    console.log(`Récupération des photos pour ${rows.length} ministres...`);
    for (const m of rows) {
        await fetchPhoto(m.id, `${m.prenom} ${m.nom}`);
        await sleep(200);
    }
    console.log('Terminé.');
} else {
    // Députés depuis deputes.json (comportement original)
    const deputes = JSON.parse(readFileSync(deputesPath, 'utf-8'));
    await pool.end();

    console.log(`Récupération des photos pour ${deputes.length} députés...`);
    for (const depute of deputes) {
        await fetchPhoto(depute.id, `${depute.prenom} ${depute.nom}`);
        await sleep(200);
    }
    console.log('Terminé.');
}

