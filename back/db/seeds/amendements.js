import { readFileSync, readdirSync, rmSync, mkdirSync, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';
import https from 'https';
import { execSync } from 'child_process';
import 'dotenv/config';
import pool from '../dbManager.js';
import { logSeed } from './helpers/logSeed.js';
import Amendement from '../models/Amendement.js';
import DeputeAmendement from '../models/DeputeAmendement.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGISLATURE = process.env.CURRENT_LEGISLATURE || '17';
const ZIP_URL = `https://data.assemblee-nationale.fr/static/openData/repository/${LEGISLATURE}/loi/amendements_div_legis/Amendements.json.zip`;
const TMP_DIR = path.join(__dirname, '../../../tmp/amendements');
const ZIP_PATH = path.join(TMP_DIR, 'Amendements.json.zip');
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

const isNil = val =>
    val === null || val === undefined || (typeof val === 'object' && val['@xsi:nil'] === 'true');

const parseAmendementFile = filepath => {
    const raw = JSON.parse(readFileSync(filepath, 'utf8'));
    const a = raw.amendement;
    if (!a) return null;

    const ident = a.identification || {};
    const signataires = a.signataires || {};
    const auteur = signataires.auteur || {};
    const division = a.pointeurFragmentTexte?.division || {};
    const contenu = a.corps?.contenuAuteur || {};
    const cycle = a.cycleDeVie || {};
    const etatTraitements = cycle.etatDesTraitements || {};

    // Extraire les cosignataires (peut être un array, un string, ou null)
    const cosignatairesRaw = signataires.cosignataires?.acteurRef;
    let cosignataires = [];
    if (Array.isArray(cosignatairesRaw)) {
        cosignataires = cosignatairesRaw;
    } else if (typeof cosignatairesRaw === 'string') {
        cosignataires = [cosignatairesRaw];
    }

    const auteurRef = isNil(auteur.acteurRef) ? null : auteur.acteurRef;
    const groupeRef = isNil(auteur.groupePolitiqueRef) ? null : auteur.groupePolitiqueRef;

    const allSignataires = [];
    if (auteurRef) {
        allSignataires.push({ id_depute: auteurRef, role: 'auteur' });
    }
    for (const id of cosignataires) {
        allSignataires.push({ id_depute: id, role: 'cosignataire' });
    }

    return {
        amendement: {
            uid: a.uid,
            legislature: parseInt(a.legislature, 10) || null,
            numero_long: ident.numeroLong || null,
            numero_ordre_depot: parseInt(ident.numeroOrdreDepot, 10) || null,
            texte_legislatif_ref: isNil(a.texteLegislatifRef) ? null : a.texteLegislatifRef,
            auteur_ref: auteurRef,
            groupe_politique_ref: groupeRef,
            article_titre: isNil(division.titre) ? null : (division.titre || null),
            article_designation: isNil(division.articleDesignationCourte) ? null : (division.articleDesignationCourte || null),
            dispositif: isNil(contenu.dispositif) ? null : (contenu.dispositif || null),
            expose_sommaire: isNil(contenu.exposeSommaire) ? null : (contenu.exposeSommaire || null),
            date_depot: cycle.dateDepot || null,
            date_publication: cycle.datePublication || null,
            sort: isNil(cycle.sort) ? null : (cycle.sort || null),
            etat: etatTraitements.etat?.libelle || null,
            sous_etat: etatTraitements.sousEtat?.libelle || null,
        },
        signataires: allSignataires,
    };
};

const BATCH_SIZE = 50;

const run = async () => {
    mkdirSync(TMP_DIR, { recursive: true });
    mkdirSync(EXTRACT_DIR, { recursive: true });

    try {
        // 1. Télécharger le zip
        console.log(`Téléchargement depuis ${ZIP_URL}...`);
        await downloadFile(ZIP_URL, ZIP_PATH);
        console.log('Téléchargement terminé.');

        // 3. Dézipper
        console.log('Décompression...');
        execSync(`unzip -o -q "${ZIP_PATH}" -d "${EXTRACT_DIR}"`);
        console.log('Décompression terminée.');

        // 4. Charger les UIDs déjà en base pour ne pas réimporter
        const { rows: existingRows } = await pool.query('SELECT uid FROM amendements');
        const existingUids = new Set(existingRows.map(r => r.uid));
        console.log(`${existingUids.size} amendements déjà en base.`);

        // 5. Trouver tous les fichiers JSON et filtrer ceux déjà importés
        const allFilePaths = findJsonFiles(EXTRACT_DIR);
        const filesToProcess = [];
        let skipped = 0;

        for (const filepath of allFilePaths) {
            const uid = path.basename(filepath, '.json');
            if (existingUids.has(uid)) {
                skipped++;
            } else {
                filesToProcess.push(filepath);
            }
        }

        console.log(`${skipped} fichiers ignorés (déjà en base), ${filesToProcess.length} fichiers à importer.`);

        if (filesToProcess.length === 0) {
            console.log('Aucun nouvel amendement à importer.');
            return;
        }

        // 6. Précharger les IDs des députés connus pour filtrer les signataires
        const { rows: deputeRows } = await pool.query('SELECT id FROM deputes');
        const deputesConnus = new Set(deputeRows.map(r => r.id));
        console.log(`${deputesConnus.size} députés chargés pour filtrage.`);

        // 7. Import par batch
        console.log(`Import de ${filesToProcess.length} amendements...`);
        let done = 0;
        let errors = 0;

        for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
            const batch = filesToProcess.slice(i, i + BATCH_SIZE);
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                for (const filepath of batch) {
                    try {
                        const parsed = parseAmendementFile(filepath);
                        if (!parsed) { errors++; continue; }

                        const { amendement, signataires } = parsed;
                        const signatairesConnus = signataires.filter(s => deputesConnus.has(s.id_depute));

                        await Amendement.upsert(amendement);
                        await DeputeAmendement.insertBulk(amendement.uid, signatairesConnus, client);
                        done++;
                    } catch {
                        errors++;
                    }
                }
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                console.error('Erreur batch :', e.message);
            } finally {
                client.release();
            }

            if ((i / BATCH_SIZE) % 20 === 0) {
                console.log(`  ${done}/${filesToProcess.length} amendements insérés...`);
            }
        }

        console.log(`Import terminé : ${done} amendements insérés, ${errors} erreurs.`);
    } finally {
        // 8. Nettoyer les fichiers temporaires
        rmSync(TMP_DIR, { recursive: true, force: true });
        console.log('Fichiers temporaires supprimés.');
        await logSeed('amendements');
    }
};

run().finally(() => pool.end());
