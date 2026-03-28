import { Router } from 'express';
import Parti from '../../db/models/Parti.js';

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
