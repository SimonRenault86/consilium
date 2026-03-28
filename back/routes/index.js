import { Router } from 'express';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { groupes, groupeOrdreGaucheaDroite } from '../../front/helpers/partis.js';
import Depute from '../db/models/Depute.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const deputes = JSON.parse(
    readFileSync(path.join(__dirname, '../../front/helpers/brut/deputes.json'), 'utf8')
);

const toSlug = text =>
    text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const formatDate = dateStr => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};

// Commissions permanentes de l'Assemblée nationale (organeRef → nom)
const commissionsPermRef = {
    PO59046: 'Commission des affaires culturelles et de l\'éducation',
    PO59048: 'Commission des affaires économiques',
    PO59050: 'Commission des affaires étrangères',
    PO59051: 'Commission des affaires sociales',
    PO59052: 'Commission de la défense nationale et des forces armées',
    PO59053: 'Commission du développement durable et de l\'aménagement du territoire',
    PO59054: 'Commission des finances, de l\'économie générale et du contrôle budgétaire',
    PO59056: 'Commission des lois constitutionnelles, de la législation et de l\'administration générale de la République',
};

const extractMandatsInfo = eluBrut => {
    const raw = eluBrut?.acteur?.mandats?.mandat;
    if (!raw) return {};

    const mandats = Array.isArray(raw) ? raw : [raw];

    const mandatAssemblee = mandats.find(m => m.typeOrgane === 'ASSEMBLEE') || null;
    const mandatsComper = mandats.filter(m => m.typeOrgane === 'COMPER');

    // Infos mandat principal
    let mandatPrincipal = null;
    if (mandatAssemblee) {
        const election = mandatAssemblee.election || {};
        const mandature = mandatAssemblee.mandature || {};
        const lieu = election.lieu || {};

        const collaborateursRaw = mandatAssemblee.collaborateurs?.collaborateur;
        const collaborateurs = collaborateursRaw
            ? (Array.isArray(collaborateursRaw) ? collaborateursRaw : [collaborateursRaw])
            : [];

        mandatPrincipal = {
            legislature: mandatAssemblee.legislature,
            region: lieu.region || null,
            causeMandat: election.causeMandat || null,
            placeHemicycle: mandature.placeHemicycle ? parseInt(mandature.placeHemicycle, 10) : null,
            premiereElection: mandature.premiereElection === '1',
            collaborateurs: collaborateurs.map(c => `${c.qualite} ${c.prenom} ${c.nom}`)
        };
    }

    // Commissions permanentes
    const commissions = mandatsComper
        .map(m => {
            const ref = m.organes?.organeRef;
            const nom = commissionsPermRef[ref] || null;
            if (!nom) return null;
            return {
                nom,
                role: m.infosQualite?.libQualite || 'Membre'
            };
        })
        .filter(Boolean);

    return { mandatPrincipal, commissions };
};

router.get('/', (req, res) => {
    res.render('home.njk', {
        title: 'Consilium — Assemblée Nationale'
    });
});

// --- API votes ---
const VOTES_DIR = path.join(__dirname, '../../front/helpers/brut/votes');

// Extrait le numéro du vote depuis le nom de fichier (VTANR5L17V{n}.json → n)
const numFromFilename = f => parseInt(f.replace('VTANR5L17V', '').replace('.json', ''), 10);

// Liste triée par numéro décroissant (les plus récents en premier), calculée une fois au démarrage
const allVoteFiles = readdirSync(VOTES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => numFromFilename(b) - numFromFilename(a));

const parseVoteFile = filename => {
    const raw = JSON.parse(readFileSync(path.join(VOTES_DIR, filename), 'utf8'));
    const s = raw.scrutin;

    const groupesArr = (() => {
        const g = s.ventilationVotes?.organe?.groupes?.groupe || [];
        return Array.isArray(g) ? g : [g];
    })();

    const votantsMap = {};
    for (const g of groupesArr) {
        const dn = g.vote?.decompteNominatif;
        if (!dn) continue;
        const extract = (section, position) => {
            if (!section?.votant) return;
            const arr = Array.isArray(section.votant) ? section.votant : [section.votant];
            for (const v of arr) votantsMap[v.acteurRef] = position;
        };
        extract(dn.pours, 'pour');
        extract(dn.contres, 'contre');
        extract(dn.abstentions, 'abstention');
    }

    return {
        uid: s.uid,
        numero: parseInt(s.numero, 10),
        dateScrutin: s.dateScrutin,
        titre: s.titre,
        sort: s.sort?.code || null,
        demandeur: s.demandeur?.texte || null,
        synthese: {
            votants: parseInt(s.syntheseVote?.nombreVotants || '0', 10),
            pour: parseInt(s.syntheseVote?.decompte?.pour || '0', 10),
            contre: parseInt(s.syntheseVote?.decompte?.contre || '0', 10),
            abstentions: parseInt(s.syntheseVote?.decompte?.abstentions || '0', 10),
        },
        votantsMap,
    };
};

// --- API députés ---
router.get('/api/deputes', async (req, res) => {
    try {
        const deputes = await Depute.findAll();
        res.json(deputes);
    } catch (err) {
        console.error('Erreur /api/deputes :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/api/votes', (req, res) => {
    const { from, to, limit = '10', q } = req.query;

    // Validation basique des dates pour éviter toute injection de chemin
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if ((from && !dateRe.test(from)) || (to && !dateRe.test(to))) {
        return res.status(400).json({ error: 'Format de date invalide' });
    }

    const maxLimit = Math.min(parseInt(limit, 10) || 10, 200);
    const search = q ? String(q).toLowerCase().trim() : null;

    const results = [];
    for (const f of allVoteFiles) {
        if (results.length >= maxLimit) break;
        try {
            const vote = parseVoteFile(f);
            if (from && vote.dateScrutin < from) continue;
            if (to && vote.dateScrutin > to) continue;
            if (search && !vote.titre.toLowerCase().includes(search)) continue;
            results.push(vote);
        } catch (e) {
            // fichier corrompu, on saute
        }
    }
    res.json(results);
});

router.get('/partis', (req, res) => {
    const groupesData = Object.keys(groupeOrdreGaucheaDroite)
        .sort((a, b) => groupeOrdreGaucheaDroite[a] - groupeOrdreGaucheaDroite[b])
        .map(abrev => {
            const info = groupes[abrev];
            const membres = deputes
                .filter(d => d.groupeAbrev === abrev)
                .map(d => ({
                    id: d.id,
                    prenom: d.prenom,
                    nom: d.nom,
                    departementNom: d.departementNom,
                    slug: toSlug(`${d.prenom} ${d.nom}`),
                    initiales: `${d.prenom[0]}${d.nom[0]}`
                }));
            if (!membres.length) return null;
            return {
                abrev,
                nom: info?.nom || abrev,
                logo: info?.logo || null,
                deputes: membres
            };
        })
        .filter(Boolean);

    const totalDeputes = groupesData.reduce((acc, g) => acc + g.deputes.length, 0);

    res.render('partis.njk', {
        title: 'Groupes politiques — Consilium',
        groupes: groupesData,
        totalDeputes
    });
});

router.get('/elu/:slug', (req, res) => {
    const { slug } = req.params;
    const deputeRaw = deputes.find(d => toSlug(`${d.prenom} ${d.nom}`) === slug);

    if (!deputeRaw) {
        return res.status(404).render('elu.njk', {
            title: 'Élu introuvable — Consilium',
            slug,
            depute: null,
            groupe: null,
            hatvpUrl: null,
            mandatPrincipal: null,
            commissions: [],
            deputesSimilaires: []
        });
    }

    let hatvpUrl = null;
    let mandatPrincipal = null;
    let commissions = [];
    try {
        const eluPath = path.join(__dirname, '../../front/helpers/brut/elu', `${deputeRaw.id}.json`);
        const eluBrut = JSON.parse(readFileSync(eluPath, 'utf8'));
        hatvpUrl = eluBrut?.acteur?.uri_hatvp || null;
        ({ mandatPrincipal, commissions } = extractMandatsInfo(eluBrut));
    } catch (e) {
        // fichier brut absent
    }

    const groupe = groupes[deputeRaw.groupeAbrev] || null;

    const depute = {
        ...deputeRaw,
        naissanceFormatee: formatDate(deputeRaw.naissance),
        priseFonctionFormatee: formatDate(deputeRaw.datePriseFonction),
        scoreParticipationPct: deputeRaw.scoreParticipation != null
            ? Math.round(deputeRaw.scoreParticipation * 100)
            : null,
        scoreLoyautePct: deputeRaw.scoreLoyaute != null
            ? Math.round(deputeRaw.scoreLoyaute * 100)
            : null
    };

    // Députés du même département, en excluant le député courant
    let memeZone = deputes.filter(d => d.departementCode === deputeRaw.departementCode && d.id !== deputeRaw.id);
    // Si le département a moins de 3 autres députés, on complète avec la même région
    if (memeZone.length < 3) {
        const memeRegion = deputes.filter(d =>
            d.departementCode !== deputeRaw.departementCode
            && d.id !== deputeRaw.id
            && !memeZone.some(x => x.id === d.id)
        );
        memeZone = [...memeZone, ...memeRegion];
    }
    // Shuffle
    for (let i = memeZone.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [memeZone[i], memeZone[j]] = [memeZone[j], memeZone[i]];
    }
    const deputesSimilaires = memeZone.slice(0, 3).map(d => ({
        prenom: d.prenom,
        nom: d.nom,
        slug: toSlug(`${d.prenom} ${d.nom}`),
        photoUrl: `/elus/${d.id}.jpg`,
        initiales: `${d.prenom[0]}${d.nom[0]}`
    }));

    res.render('elu.njk', {
        title: `${depute.civ} ${depute.prenom} ${depute.nom} — Consilium`,
        slug,
        depute,
        groupe,
        hatvpUrl,
        mandatPrincipal,
        commissions,
        deputesSimilaires
    });
});

export default router;
