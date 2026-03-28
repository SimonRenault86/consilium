import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { groupes, groupeOrdreGaucheaDroite } from '../../front/helpers/partis.js';

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

    const commissions = mandatsComper
        .map(m => {
            const ref = m.organes?.organeRef;
            const nom = commissionsPermRef[ref] || null;
            if (!nom) return null;
            return { nom, role: m.infosQualite?.libQualite || 'Membre' };
        })
        .filter(Boolean);

    return { mandatPrincipal, commissions };
};

router.get('/', (req, res) => {
    res.render('home.njk', {
        title: 'Consilium — Assemblée Nationale'
    });
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

router.get('/depute/:slug', (req, res) => {
    const { slug } = req.params;
    const deputeRaw = deputes.find(d => toSlug(`${d.prenom} ${d.nom}`) === slug);

    if (!deputeRaw) {
        return res.status(404).render('depute.njk', {
            title: 'Député introuvable — Consilium',
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

    let memeZone = deputes.filter(d => d.departementCode === deputeRaw.departementCode && d.id !== deputeRaw.id);
    if (memeZone.length < 3) {
        const memeRegion = deputes.filter(d =>
            d.departementCode !== deputeRaw.departementCode
            && d.id !== deputeRaw.id
            && !memeZone.some(x => x.id === d.id)
        );
        memeZone = [...memeZone, ...memeRegion];
    }
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

    res.render('depute.njk', {
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

router.get('/api-doc', (req, res) => {
    res.render('api-doc.njk', {
        title: 'API — Consilium'
    });
});

export default router;
