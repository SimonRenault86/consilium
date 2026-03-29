import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import Depute from '../../db/models/Depute.js';
import DeputeVote from '../../db/models/DeputeVote.js';
import { groupes } from '../../../front/helpers/partis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const extractBrutInfo = id => {
    try {
        const eluBrut = JSON.parse(
            readFileSync(path.join(__dirname, '../../../front/helpers/brut/elu', `${id}.json`), 'utf8')
        );
        const raw = eluBrut?.acteur?.mandats?.mandat;
        const hatvpUrl = eluBrut?.acteur?.uri_hatvp || null;
        if (!raw) return { hatvpUrl, mandatPrincipal: null, commissions: [] };

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
                collaborateurs: collaborateurs.map(c => `${c.qualite} ${c.prenom} ${c.nom}`),
            };
        }

        const commissions = mandatsComper
            .map(m => {
                const nom = commissionsPermRef[m.organes?.organeRef] || null;
                if (!nom) return null;
                return { nom, role: m.infosQualite?.libQualite || 'Membre' };
            })
            .filter(Boolean);

        return { hatvpUrl, mandatPrincipal, commissions };
    } catch {
        return { hatvpUrl: null, mandatPrincipal: null, commissions: [] };
    }
};

const router = Router();

router.get('/', async (req, res) => {
    try {
        const deputes = await Depute.findAll();
        res.json(deputes);
    } catch (err) {
        console.error('Erreur GET /api/deputes :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const row = await Depute.findById(req.params.id);
        if (!row) return res.status(404).json({ error: 'Député introuvable' });

        const { hatvpUrl, mandatPrincipal, commissions } = extractBrutInfo(row.id);
        const groupe = groupes[row.groupe_abrev] || null;

        res.json({
            id: row.id,
            legislature: row.legislature,
            civ: row.civ,
            nom: row.nom,
            prenom: row.prenom,
            villeNaissance: row.ville_naissance,
            naissance: row.naissance,
            age: row.age,
            groupe: row.groupe,
            groupeAbrev: row.groupe_abrev,
            groupeLogo: groupe?.logo || null,
            groupeCouleur: groupe?.couleur || null,
            departementNom: row.departement_nom,
            departementCode: row.departement_code,
            circo: row.circo,
            datePriseFonction: row.date_prise_fonction,
            job: row.job,
            mail: row.mail,
            twitter: row.twitter,
            facebook: row.facebook,
            website: row.website,
            nombreMandats: row.nombre_mandats,
            experienceDepute: row.experience_depute,
            scoreParticipation: row.score_participation,
            scoreLoyaute: row.score_loyaute,
            hatvpUrl,
            mandatPrincipal,
            commissions,
        });
    } catch (err) {
        console.error('Erreur GET /api/deputes/:id :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/:id/scrutins-stats', async (req, res) => {
    try {
        const stats = await DeputeVote.findStatsByDepute(req.params.id);
        if (stats.total === 0) return res.status(404).json({ error: 'Aucun scrutin trouvé pour ce député' });
        res.json(stats);
    } catch (err) {
        console.error('Erreur GET /api/deputes/:id/scrutins-stats :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
