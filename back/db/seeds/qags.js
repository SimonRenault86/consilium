import { readFileSync, readdirSync, rmSync, mkdirSync, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';
import https from 'https';
import { execSync } from 'child_process';
import 'dotenv/config';
import pool from '../dbManager.js';
import { logSeed } from './helpers/logSeed.js';
import Qag from '../models/Qag.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGISLATURE = process.env.CURRENT_LEGISLATURE || '17';
const ZIP_URL = `http://data.assemblee-nationale.fr/static/openData/repository/${LEGISLATURE}/questions/questions_gouvernement/Questions_gouvernement.json.zip`;
const TMP_DIR = path.join(__dirname, '../../../tmp/qags');
const ZIP_PATH = path.join(TMP_DIR, 'Questions_gouvernement.json.zip');
const EXTRACT_DIR = path.join(TMP_DIR, 'extracted');

const downloadFile = (url, dest) => new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = createWriteStream(dest);

    const req = protocol.get(url, response => {
        if (response.statusCode === 301 || response.statusCode === 302) {
            file.close();
            rmSync(dest, { force: true });
            downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            return;
        }
        if (response.statusCode !== 200) {
            file.close();
            rmSync(dest, { force: true });
            reject(new Error(`Téléchargement échoué : status ${response.statusCode}`));
            return;
        }
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', reject);
    });

    req.on('error', err => {
        rmSync(dest, { force: true });
        reject(err);
    });
});

const findJsonFiles = dir => {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findJsonFiles(fullPath));
        } else if (entry.name.endsWith('.json')) {
            results.push(fullPath);
        }
    }
    return results;
};

// Normalise les abbréviations de groupes de l'AN vers celles utilisées dans le frontend
const GROUPE_ABREV_NORMALIZE = {
    'LFI-NFP': 'LFI',
    'UDR':     'UDDPLR',
};

const normalizeAbrev = abrev => GROUPE_ABREV_NORMALIZE[abrev] ?? abrev;

const parseQagFile = filepath => {
    const raw = JSON.parse(readFileSync(filepath, 'utf8'));
    const q = raw.question;

    // minAttrib peut être un objet ou un tableau
    const minAttribRaw = q.minAttribs?.minAttrib;
    const minAttrib = Array.isArray(minAttribRaw) ? minAttribRaw[0] : minAttribRaw;
    const date_seance = minAttrib?.infoJO?.dateJO || q.cloture?.dateCloture || null;

    // analyse peut être une chaîne ou un tableau
    const analysesRaw = q.indexationAN?.analyses?.analyse;
    const analyse = Array.isArray(analysesRaw)
        ? analysesRaw[0]
        : (typeof analysesRaw === 'string' ? analysesRaw : null);

    // texte_reponse : peut être un objet ou un tableau
    const texteRepRaw = q.textesReponse?.texteReponse;
    const texteRep = Array.isArray(texteRepRaw) ? texteRepRaw[0] : texteRepRaw;
    const texte_reponse = texteRep?.texte || null;

    return {
        uid: q.uid,
        numero: parseInt(q.identifiant?.numero || '0', 10),
        legislature: parseInt(q.identifiant?.legislature || LEGISLATURE, 10),
        date_seance,
        rubrique: q.indexationAN?.rubrique || null,
        sujet: analyse,
        acteur_ref: q.auteur?.identite?.acteurRef || null,
        mandat_ref: q.auteur?.identite?.mandatRef || null,
        groupe_ref: q.auteur?.groupe?.organeRef || null,
        groupe_abrev: normalizeAbrev(q.auteur?.groupe?.abrege || null),
        groupe_developpe: q.auteur?.groupe?.developpe || null,
        min_ref: q.minInt?.organeRef || null,
        min_abrege: q.minInt?.abrege || null,
        min_developpe: q.minInt?.developpe || null,
        texte_reponse,
        code_cloture: q.cloture?.codeCloture || null,
    };
};

const BATCH_SIZE = 100;

const run = async () => {
    mkdirSync(TMP_DIR, { recursive: true });
    mkdirSync(EXTRACT_DIR, { recursive: true });

    try {
        // 1. Télécharger le zip
        console.log(`Téléchargement depuis ${ZIP_URL}...`);
        await downloadFile(ZIP_URL, ZIP_PATH);
        console.log('Téléchargement terminé.');

        // 2. Dézipper
        console.log('Décompression...');
        execSync(`unzip -o "${ZIP_PATH}" -d "${EXTRACT_DIR}"`);
        console.log('Décompression terminée.');

        // 3. Récupérer le dernier numéro en base
        const { rows: lastRows } = await pool.query(
            'SELECT MAX(numero) AS max_numero FROM qags WHERE legislature = $1',
            [parseInt(LEGISLATURE)]
        );
        const lastNumero = lastRows[0]?.max_numero || 0;
        console.log(lastNumero
            ? `Dernier QaG en base : numéro ${lastNumero}`
            : 'Aucun QaG en base, import complet.'
        );

        // 4. Trouver et filtrer les fichiers JSON
        const allFilePaths = findJsonFiles(EXTRACT_DIR).sort();

        let filesSkipped = 0;
        const filesToProcess = [];

        for (const filepath of allFilePaths) {
            const filename = path.basename(filepath, '.json');
            // Format : QANR5L17QG{numero}
            const match = filename.match(/QG(\d+)$/i);
            const numero = match ? parseInt(match[1], 10) : null;

            if (numero !== null && numero <= lastNumero) {
                filesSkipped++;
                continue;
            }
            filesToProcess.push(filepath);
        }

        console.log(`${filesSkipped} fichiers ignorés (déjà en base), ${filesToProcess.length} à importer.`);

        if (filesToProcess.length === 0) {
            console.log('Aucun nouveau QaG à importer.');
            await logSeed('qags');
            return;
        }

        // 5. Créer la table si elle n'existe pas
        const sqlPath = new URL('../table_qags.sql', import.meta.url);
        await pool.query(readFileSync(sqlPath, 'utf8'));
        console.log('Table qags vérifiée/créée.');

        // 6. Import par batch
        let done = 0;
        let errors = 0;

        for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
            const batch = filesToProcess.slice(i, i + BATCH_SIZE);
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                for (const filepath of batch) {
                    try {
                        const qag = parseQagFile(filepath);
                        await Qag.upsert(qag);
                        done++;
                    } catch (e) {
                        errors++;
                        console.error(`Erreur fichier ${path.basename(filepath)} :`, e.message);
                    }
                }
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                console.error('Erreur batch :', e.message);
            } finally {
                client.release();
            }

            process.stdout.write(`\rImportés : ${Math.min(i + BATCH_SIZE, filesToProcess.length)} / ${filesToProcess.length}`);
        }

        console.log(`\nTerminé. ${done} QaGs importés, ${errors} erreurs.`);
        await logSeed('qags');
    } finally {
        // Nettoyage
        rmSync(TMP_DIR, { recursive: true, force: true });
        await pool.end();
    }
};

run().catch(err => {
    console.error('Erreur seed QaGs :', err);
    process.exit(1);
});
