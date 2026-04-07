import { Router } from 'express';
import RapportHebdo from '../../db/models/RapportHebdo.js';

const router = Router();

// GET /api/rapport-hebdo — liste des semaines disponibles
router.get('/', async (req, res) => {
    try {
        const semaines = await RapportHebdo.findSemaines();
        res.json(semaines);
    } catch (err) {
        console.error('Erreur GET /api/rapport-hebdo :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/rapport-hebdo/latest — rapport le plus récent
router.get('/latest', async (req, res) => {
    try {
        const rapport = await RapportHebdo.findLatest();
        if (!rapport) return res.status(404).json({ error: 'Aucun rapport disponible' });
        res.json(rapport);
    } catch (err) {
        console.error('Erreur GET /api/rapport-hebdo/latest :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/rapport-hebdo/:semaine — rapport d'une semaine (YYYY-MM-DD)
router.get('/:semaine', async (req, res) => {
    const { semaine } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(semaine)) {
        return res.status(400).json({ error: 'Format invalide. Attendu : YYYY-MM-DD' });
    }
    try {
        const rapport = await RapportHebdo.findBySemaine(semaine);
        if (!rapport) return res.status(404).json({ error: 'Rapport introuvable' });
        res.json(rapport);
    } catch (err) {
        console.error('Erreur GET /api/rapport-hebdo/:semaine :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
