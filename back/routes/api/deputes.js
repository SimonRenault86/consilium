import { Router } from 'express';
import Depute from '../../db/models/Depute.js';

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

export default router;
