import { Router } from 'express';
import Parti from '../../db/models/Parti.js';
import Vote from '../../db/models/Vote.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const partis = await Parti.findAll();
        res.json(partis);
    } catch (err) {
        console.error('Erreur GET /api/partis :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/:abrev/scrutins', async (req, res) => {
    const abrev = req.params.abrev.toUpperCase();
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    try {
        const rows = await Vote.findByGroupe(abrev, { limit });
        res.json(rows.map(row => ({
            uid: row.uid,
            numero: row.numero,
            titre: row.titre,
            sort: row.sort,
            dateScrutin: row.date_scrutin instanceof Date
                ? row.date_scrutin.toISOString().slice(0, 10)
                : String(row.date_scrutin).slice(0, 10),
            categorie: row.categorie_nom ? { nom: row.categorie_nom, couleur: row.categorie_couleur } : null,
            groupeVote: {
                pour: parseInt(row.groupe_pour, 10),
                contre: parseInt(row.groupe_contre, 10),
                abstentions: parseInt(row.groupe_abstentions, 10),
            },
            synthese: {
                votants: row.nb_votants,
                pour: row.nb_pour,
                contre: row.nb_contre,
                abstentions: row.nb_abstentions,
            },
        })));
    } catch (err) {
        console.error('Erreur GET /api/partis/:abrev/scrutins :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/:abrev/stats', async (req, res) => {
    const abrev = req.params.abrev.toUpperCase();
    try {
        const rows = await Vote.findStatsByGroupe(abrev);
        res.json(rows.map(row => ({
            categorie: row.categorie,
            couleur: row.couleur,
            nbScrutins: parseInt(row.nb_scrutins, 10),
            nbPour: parseInt(row.nb_pour, 10),
            nbContre: parseInt(row.nb_contre, 10),
            nbAbstentions: parseInt(row.nb_abstentions, 10),
            nbNonParticipation: parseInt(row.nb_non_participation, 10),
        })));
    } catch (err) {
        console.error('Erreur GET /api/partis/:abrev/stats :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.get('/:abrev', async (req, res) => {
    try {
        const parti = await Parti.findByAbrev(req.params.abrev.toUpperCase());
        if (!parti) return res.status(404).json({ error: 'Parti introuvable' });
        res.json(parti);
    } catch (err) {
        console.error('Erreur GET /api/partis/:abrev :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
