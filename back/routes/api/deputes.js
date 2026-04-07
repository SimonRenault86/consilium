import { Router } from 'express';
import Depute from '../../db/models/Depute.js';
import DeputeVote from '../../db/models/DeputeVote.js';
import DeputeCoherence from '../../db/models/DeputeCoherence.js';
import DeputeScoreHistory from '../../db/models/DeputeScoreHistory.js';
import { groupes } from '../../../front/helpers/partis.js';

const router = Router();

router.get('/coherence-badges', async (req, res) => {
    try {
        const badges = await DeputeCoherence.findAllBadges();
        res.json(badges);
    } catch (err) {
        console.error('Erreur GET /api/deputes/coherence-badges :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

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

        const commissions = await Depute.findCommissionsByDepute(row.id);
        const groupe = groupes[row.groupe_abrev] || null;

        const mandatPrincipal = (row.region || row.cause_mandat || row.place_hemicycle || row.collaborateurs)
            ? {
                legislature: row.legislature,
                region: row.region,
                causeMandat: row.cause_mandat,
                placeHemicycle: row.place_hemicycle,
                premiereElection: row.premiere_election ?? false,
                collaborateurs: row.collaborateurs ?? [],
            }
            : null;

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
            scoreParticipation: row.score_participation !== null ? parseFloat(row.score_participation) : null,
            scoreParticipationSpecialite: row.score_participation_specialite !== null ? parseFloat(row.score_participation_specialite) : null,
            scoreLoyaute: row.score_loyaute !== null ? parseFloat(row.score_loyaute) : null,
            scoreMajorite: row.score_majorite !== null ? parseFloat(row.score_majorite) : null,
            hatvpUrl: row.hatvp_url,
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

router.get('/:id/coherence/all', async (req, res) => {
    try {
        const rows = await DeputeCoherence.findAllByDepute(req.params.id);
        if (!rows.length) return res.status(404).json({ error: 'Aucune analyse de cohérence disponible' });

        res.json(rows.map(row => ({
            mois:       row.mois ? row.mois.toISOString().slice(0, 7) : null,
            statut:     row.statut,
            recap:      row.recap,
            resume:     row.resume,
            coherence:  row.coherence,
            computedAt: row.computed_at,
        })));
    } catch (err) {
        console.error('Erreur GET /api/deputes/:id/coherence/all :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/:id/coherence', async (req, res) => {
    try {
        const mois = req.query.mois || null;
        const row = await DeputeCoherence.findByDepute(req.params.id, mois);
        if (!row) return res.status(200).json(null);

        const moisDispos = await DeputeCoherence.findMoisByDepute(req.params.id);

        res.json({
            mois:       row.mois ? row.mois.toISOString().slice(0, 7) : null,
            statut:     row.statut,
            recap:      row.recap,
            resume:     row.resume,
            coherence:  row.coherence,
            computedAt: row.computed_at,
            moisDispos,
        });
    } catch (err) {
        console.error('Erreur GET /api/deputes/:id/coherence :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/:id/scores-history', async (req, res) => {
    try {
        const rows = await DeputeScoreHistory.findByDepute(req.params.id);
        if (!rows.length) return res.status(404).json({ error: 'Aucun historique de scores disponible' });

        res.json(rows.map(row => ({
            dateMaj:                    row.date_maj ? row.date_maj.toISOString().slice(0, 10) : null,
            scoreParticipation:         row.score_participation != null ? parseFloat(row.score_participation) : null,
            scoreParticipationSpecialite: row.score_participation_specialite != null ? parseFloat(row.score_participation_specialite) : null,
            scoreLoyaute:               row.score_loyaute != null ? parseFloat(row.score_loyaute) : null,
            scoreMajorite:              row.score_majorite != null ? parseFloat(row.score_majorite) : null,
            nationalAvg:                row.avg_participation != null ? parseFloat(row.avg_participation) : null,
        })));
    } catch (err) {
        console.error('Erreur GET /api/deputes/:id/scores-history :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
