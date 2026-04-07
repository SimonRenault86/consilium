import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from '../dbManager.js';
import Acteur from '../models/Acteur.js';
import Depute from '../models/Depute.js';
import DeputeScoreHistory from '../models/DeputeScoreHistory.js';
import { logSeed } from './helpers/logSeed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deputesBrut = JSON.parse(
    readFileSync(path.join(__dirname, '../../../front/helpers/brut/deputes.json'), 'utf-8')
);

const calcParticipationMensuelle = async () => {
    const now = new Date();
    let month = now.getMonth(); // 0-indexé → mois précédent
    let year = now.getFullYear();
    if (month === 0) { month = 12; year -= 1; }

    const paddedMonth = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();
    const dateDebut = `${year}-${paddedMonth}-01`;
    const dateFin = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

    console.log(`Calcul participation mensuelle — ${paddedMonth}/${year} (${dateDebut} → ${dateFin})`);

    const { rows: scrutins } = await pool.query(
        'SELECT uid FROM scrutins WHERE date_scrutin >= $1 AND date_scrutin <= $2',
        [dateDebut, dateFin]
    );

    if (scrutins.length === 0) {
        console.log('Aucun scrutin trouvé pour cette période. Participation non calculée.');
        return;
    }

    const scrutinUids = scrutins.map(s => s.uid);

    const { rows: voteCounts } = await pool.query(
        `SELECT
            d.id AS id_depute,
            COUNT(dv.id_vote)::INTEGER AS votes_count
         FROM deputes d
         LEFT JOIN deputes_votes dv
            ON dv.id_depute = d.id
           AND dv.id_vote = ANY($1::varchar[])
         GROUP BY d.id`,
        [scrutinUids]
    );

    const total = scrutins.length;
    const records = voteCounts.map(row => ({
        idDepute                    : row.id_depute,
        dateMaj                     : dateFin,
        scoreParticipationMensuelle : row.votes_count / total,
    }));

    await DeputeScoreHistory.upsertParticipationMensuelle(records);

    const nonZero = records.filter(r => r.scoreParticipationMensuelle > 0).length;
    console.log(`Participation calculée pour ${records.length} député(s) (${nonZero} avec au moins 1 vote).`);
};

const run = async () => {
    try {
        console.log(`Import de ${deputesBrut.length} députés...`);

        // 1. Upsert dans acteurs (données personnelles)
        const acteursData = deputesBrut.map(d => ({
            id: d.id,
            civ: d.civ,
            nom: d.nom,
            prenom: d.prenom,
            alpha: null,
            trigramme: null,
            naissance: d.naissance || null,
            villeNaissance: d.villeNaissance || null,
            depNaissance: null,
            paysNaissance: null,
            dateDeces: null,
            profession: d.job || null,
            uriHatvp: null,
            mail: d.mail || null,
            twitter: d.twitter || null,
            facebook: d.facebook || null,
            instagram: null,
            linkedin: null,
            siteInternet: d.website || null,
        }));
        await Acteur.upsertMany(acteursData);

        // 2. Upsert dans deputes (données mandataires spécifiques)
        const deputesData = deputesBrut.map(d => ({
            id: d.id,
            legislature: d.legislature,
            groupe: d.groupe,
            groupeAbrev: d.groupeAbrev,
            departementNom: d.departementNom,
            departementCode: d.departementCode,
            circo: d.circo,
            datePriseFonction: d.datePriseFonction || null,
            job: d.job || null,
            nombreMandats: d.nombreMandats ?? null,
            experienceDepute: d.experienceDepute || null,
            dateMaj: d.dateMaj || null,
        }));
        await Depute.upsertMany(deputesData);

        // 3. Insert score history snapshot (one entry per date_maj, skipped if already exists)
        const historyData = deputesBrut
            .filter(d => d.dateMaj)
            .map(d => ({
                idDepute: d.id,
                dateMaj: d.dateMaj,
                scoreParticipation: d.scoreParticipation ?? null,
                scoreParticipationSpecialite: d.scoreParticipationSpecialite ?? null,
                scoreLoyaute: d.scoreLoyaute ?? null,
                scoreMajorite: d.scoreMajorite ?? null,
            }));
        if (historyData.length) await DeputeScoreHistory.upsertMany(historyData);

        // 4. Calcul de la participation mensuelle (mois précédent)
        await calcParticipationMensuelle();

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
