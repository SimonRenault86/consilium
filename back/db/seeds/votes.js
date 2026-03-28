import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from '../dbManager.js';
import Vote from '../models/Vote.js';
import TypeVote from '../models/TypeVote.js';
import DeputeVote from '../models/DeputeVote.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOTES_DIR = path.join(__dirname, '../../../front/helpers/brut/votes');

const parseVoteFile = filename => {
    const raw = JSON.parse(readFileSync(path.join(VOTES_DIR, filename), 'utf8'));
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
        typeVote: {
            code: s.typeVote?.codeTypeVote || null,
            libelle: s.typeVote?.libelleTypeVote || null,
        },
        vote: {
            uid: s.uid,
            numero: parseInt(s.numero, 10),
            legislature: parseInt(s.legislature, 10),
            date_scrutin: s.dateScrutin,
            titre: s.titre,
            sort: s.sort?.code || null,
            demandeur: s.demandeur?.texte || null,
            code_type_vote: s.typeVote?.codeTypeVote || null,
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

const allFiles = readdirSync(VOTES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

// Traitement par batch pour ne pas saturer la mémoire ni le pool PG
const BATCH_SIZE = 50;

const run = async () => {
    // Précharger les IDs des députés connus pour filtrer les votants
    // (les fichiers votes contiennent des acteurRef d'autres législatures absents de notre table)
    const { rows: deputeRows } = await pool.query('SELECT id FROM deputes');
    const deputesConnus = new Set(deputeRows.map(r => r.id));
    console.log(`${deputesConnus.size} députés chargés pour filtrage.`);

    console.log(`Import de ${allFiles.length} votes...`);
    let done = 0;
    let errors = 0;

    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
        const batch = allFiles.slice(i, i + BATCH_SIZE);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const filename of batch) {
                try {
                    const { typeVote, vote, votants } = parseVoteFile(filename);
                    const votantsConnus = votants.filter(v => deputesConnus.has(v.id_depute));
                    if (typeVote.code) await TypeVote.upsert(typeVote);
                    await Vote.upsert(vote);
                    await DeputeVote.insertBulk(vote.uid, votantsConnus, client);
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
            console.log(`  ${done}/${allFiles.length} votes insérés...`);
        }
    }

    console.log(`Import terminé : ${done} votes insérés, ${errors} erreurs.`);
};

run().finally(() => pool.end());
