import { Router } from 'express';
import MandatGouvernement from '../../db/models/MandatGouvernement.js';

const router = Router();

// GET /api/ministres — tous les mandats ministériels (actuels + passés)
router.get('/', async (req, res) => {
    try {
        const rows = await MandatGouvernement.findAllMinisteres();
        res.json(rows.map(m => ({
            acteurId: m.acteur_id,
            nom: m.nom,
            prenom: m.prenom,
            civ: m.civ,
            qualite: m.qualite,
            preseance: m.preseance,
            dateDebut: m.date_debut,
            dateFin: m.date_fin,
            isCurrent: m.date_fin === null,
        })));
    } catch (err) {
        console.error('Erreur GET /api/ministres :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/ministres/current — gouvernement actuel uniquement
router.get('/current', async (req, res) => {
    try {
        const rows = await MandatGouvernement.findActifs();
        res.json(rows.map(m => ({
            acteurId: m.acteur_id,
            nom: m.nom,
            prenom: m.prenom,
            civ: m.civ,
            qualite: m.qualite,
            preseance: m.preseance,
            dateDebut: m.date_debut,
        })));
    } catch (err) {
        console.error('Erreur GET /api/ministres/current :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
