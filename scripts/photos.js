import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deputesPath = path.join(__dirname, '../front/helpers/brut/deputes.json');
const outputDir = path.join(__dirname, '../public/elus');

const deputes = JSON.parse(readFileSync(deputesPath, 'utf-8'));

async function fetchDeputePhoto (id) {
    const depute = deputes.find(d => d.id === id);

    if (!depute) {
        console.error(`Député non trouvé: ${id}`);
        return;
    }

    const outputPath = path.join(outputDir, `${id}.jpg`);

    if (existsSync(outputPath)) {
        console.log(`Photo déjà présente pour ${depute.prenom} ${depute.nom} (${id}), ignorée.`);
        return;
    }

    const numericId = id.replace('PA', '');
    const photoUrl = `https://www.assemblee-nationale.fr/dyn/static/tribun/17/photos/carre/${numericId}.jpg`;

    try {
        console.log(`Téléchargement: ${depute.prenom} ${depute.nom}...`);
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
        console.error(`✗ Erreur pour ${depute.prenom} ${depute.nom} (${id}): ${error.message}`);
    }
}

function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const targetId = process.argv[2];

if (targetId) {
    await fetchDeputePhoto(targetId);
} else {
    console.log(`Récupération des photos pour ${deputes.length} députés...`);
    for (const depute of deputes) {
        await fetchDeputePhoto(depute.id);
        await sleep(200);
    }
    console.log('Terminé.');
}
