import { readFileSync, readdirSync, rmSync, mkdirSync, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';
import https from 'https';
import { execSync } from 'child_process';
import 'dotenv/config';
import pool from '../dbManager.js';
import Vote from '../models/Vote.js';
import DeputeVote from '../models/DeputeVote.js';
import { categoriseVotes, OPENAI_BATCH_SIZE } from './helpers/categorise.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGISLATURE = process.env.CURRENT_LEGISLATURE || '17';
const ZIP_URL = `http://data.assemblee-nationale.fr/static/openData/repository/${LEGISLATURE}/loi/scrutins/Scrutins.json.zip`;
const TMP_DIR = path.join(__dirname, '../../../tmp/votes');
const ZIP_PATH = path.join(TMP_DIR, 'Scrutins.json.zip');
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

const parseVoteFile = filepath => {
    const raw = JSON.parse(readFileSync(filepath, 'utf8'));
    const s = raw.scrutin;

    const groupesArr = (() => {
        const g = s.ventilationVotes?.organe?.groupes?.groupe || [];
        return Array.isArray(g) ? g : [g];
    })();

    const votants = [];
    for (const g of groupesArr) {
        const dn = g.vote?.decompteNominatif;
        if (!dn) continue;
        const extract = (section, position) => {
            if (!section?.votant) return;
            const arr = Array.isArray(section.votant) ? section.votant : [section.votant];
            for (const v of arr) votants.push({ id_depute: v.acteurRef, position });
        };
        extract(dn.pours, 'pour');
        extract(dn.contres, 'contre');
        extract(dn.abstentions, 'abstention');
    }

    const decompte = s.syntheseVote?.decompte || {};
    return {
        vote: {
            uid: s.uid,
            numero: parseInt(s.numero, 10),
            legislature: parseInt(s.legislature, 10),
            date_scrutin: s.dateScrutin,
            titre: s.titre,
            sort: s.sort?.code || null,
            demandeur: s.demandeur?.texte || null,
            type_majorite: s.typeVote?.typeMajorite || null,
            nb_votants: parseInt(s.syntheseVote?.nombreVotants || '0', 10),
            suffrages_exprimes: parseInt(s.syntheseVote?.suffragesExprimes || '0', 10),
            nb_suffrage_requis: parseInt(s.syntheseVote?.nbrSuffragesRequis || '0', 10),
            nb_pour: parseInt(decompte.pour || '0', 10),
            nb_contre: parseInt(decompte.contre || '0', 10),
            nb_abstentions: parseInt(decompte.abstentions || '0', 10),
            nb_non_votants: parseInt(decompte.nonVotants || '0', 10),
        },
        votants,
    };
};

// Traitement par batch pour ne pas saturer la mémoire ni le pool PG
const BATCH_SIZE = 50;

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

        // 3. Récupérer le dernier vote enregistré en base par date
        const { rows: lastVoteRows } = await pool.query(
            'SELECT MAX(numero) as max_numero, MAX(date_scrutin) as last_date FROM scrutins WHERE legislature = $1',
            [parseInt(LEGISLATURE)]
        );
        const lastNumero = lastVoteRows[0].max_numero || 0;
        const lastDate = lastVoteRows[0].last_date;

        console.log(lastDate
            ? `Dernier vote en base : date ${lastDate.toISOString().split('T')[0]}, numéro ${lastNumero}`
            : 'Aucun vote en base, import complet.'
        );

        // 4. Trouver tous les fichiers JSON extraits
        const allFilePaths = findJsonFiles(EXTRACT_DIR).sort();

        // 5. Supprimer les fichiers dont le numéro est <= au dernier vote en base (déjà importés)
        let filesDeleted = 0;
        const filesToProcess = [];
        for (const filepath of allFilePaths) {
            const filename = path.basename(filepath);
            const match = filename.match(/V(\d+)\.json$/i);
            const numero = match ? parseInt(match[1]) : null;

            if (numero !== null && numero <= lastNumero) {
                rmSync(filepath);
                filesDeleted++;
                continue;
            }
            filesToProcess.push(filepath);
        }

        console.log(`${filesDeleted} fichiers supprimés (déjà en base), ${filesToProcess.length} fichiers à importer.`);

        if (filesToProcess.length === 0) {
            console.log('Aucun nouveau vote à importer.');
            return;
        }

        // 6. Précharger les IDs des députés connus pour filtrer les votants
        // (les fichiers votes contiennent des acteurRef d'autres législatures absents de notre table)
        const { rows: deputeRows } = await pool.query('SELECT id FROM deputes');
        const deputesConnus = new Set(deputeRows.map(r => r.id));
        console.log(`${deputesConnus.size} députés chargés pour filtrage.`);

        // 7. Import par batch
        console.log(`Import de ${filesToProcess.length} votes...`);
        let done = 0;
        let errors = 0;
        const votesToCategorise = [];

        for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
            const batch = filesToProcess.slice(i, i + BATCH_SIZE);
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                for (const filepath of batch) {
                    try {
                        const { vote, votants } = parseVoteFile(filepath);
                        const votantsConnus = votants.filter(v => deputesConnus.has(v.id_depute));
                        await Vote.upsert(vote);
                        await DeputeVote.insertBulk(vote.uid, votantsConnus, client);
                        votesToCategorise.push({ uid: vote.uid, titre: vote.titre });
                        done++;
                    } catch (e) {
                        errors++;
                        // On continue sur le fichier suivant
                    }
                }
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                console.error('Erreur batch :', e.message);
            } finally {
                client.release();
            }

            if ((i / BATCH_SIZE) % 10 === 0) {
                console.log(`  ${done}/${filesToProcess.length} votes insérés...`);
            }
        }

        console.log(`Import terminé : ${done} votes insérés, ${errors} erreurs.`);

        // 8. Catégoriser les nouveaux scrutins via OpenAI
        if (process.env.OPENAI_API_KEY && votesToCategorise.length > 0) {
            console.log(`Catégorisation de ${votesToCategorise.length} scrutins via OpenAI...`);
            let catDone = 0;
            for (let i = 0; i < votesToCategorise.length; i += OPENAI_BATCH_SIZE) {
                const batch = votesToCategorise.slice(i, i + OPENAI_BATCH_SIZE);
                try {
                    const catMap = await categoriseVotes(batch);
                    const entries = Object.entries(catMap);
                    if (entries.length > 0) {
                        const uids = entries.map(([uid]) => uid);
                        const catIds = entries.map(([, v]) => v.categorieId);
                        const sousIds = entries.map(([, v]) => v.sousCategorieId || null);
                        await pool.query(
                            `UPDATE scrutins SET scrutin_categorie_id = data.cat_id, scrutin_sous_categorie_id = data.sous_id
                            FROM unnest($1::text[], $2::int[], $3::int[]) AS data(uid, cat_id, sous_id)
                            WHERE scrutins.uid = data.uid`,
                            [uids, catIds, sousIds]
                        );
                        catDone += entries.length;
                    }
                } catch (e) {
                    console.error('Erreur catégorisation batch :', e.message);
                }
                if (i + OPENAI_BATCH_SIZE < votesToCategorise.length) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            console.log(`${catDone}/${votesToCategorise.length} scrutins catégorisés.`);
        } else if (votesToCategorise.length > 0) {
            console.log('OPENAI_API_KEY absent : catégorisation ignorée. Lancez npm run seed:categorise-scrutins pour catégoriser.');
        }
    } finally {
        // 8. Nettoyer les fichiers temporaires
        rmSync(TMP_DIR, { recursive: true, force: true });
        console.log('Fichiers temporaires supprimés.');
    }
};

run().finally(() => pool.end());
