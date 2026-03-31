import { Router } from 'express';
import Vote from '../../db/models/Vote.js';
import pool from '../../db/dbManager.js';

const router = Router();

const serialize = row => ({
    uid: row.uid,
    numero: row.numero,
    dateScrutin: row.date_scrutin instanceof Date
        ? row.date_scrutin.toISOString().slice(0, 10)
        : String(row.date_scrutin).slice(0, 10),
    titre: row.titre,
    sort: row.sort,
    demandeur: row.demandeur,
    categorie: row.categorie_nom ? {
        nom: row.categorie_nom,
        couleur: row.categorie_couleur,
    } : null,
    sousCategorie: row.sous_categorie_nom ? {
        nom: row.sous_categorie_nom,
    } : null,
    typeMajorite: row.type_majorite || null,
    synthese: {
        votants: row.nb_votants,
        pour: row.nb_pour,
        contre: row.nb_contre,
        abstentions: row.nb_abstentions,
        nonVotants: row.nb_non_votants,
    },
});

// GET /api/scrutins/last-update — dernière exécution du seed scrutins
router.get('/last-update', async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT executed_at FROM seed_logs WHERE categorie = 'scrutins' ORDER BY executed_at DESC LIMIT 1"
        );
        res.json({ lastUpdate: rows[0]?.executed_at || null });
    } catch (err) {
        console.error('Erreur GET /api/scrutins/last-update :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/scrutins?from=&to=&limit=&q=
router.get('/', async (req, res) => {
    const { from, to, limit = '10', q } = req.query;

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if ((from && !dateRe.test(from)) || (to && !dateRe.test(to))) {
        return res.status(400).json({ error: 'Format de date invalide' });
    }

    try {
        const rows = await Vote.findAll({
            from: from || null,
            to: to || null,
            limit: parseInt(limit, 10) || 10,
            q: q ? String(q).trim() : null,
        });
        res.json(rows.map(serialize));
    } catch (err) {
        console.error('Erreur GET /api/scrutins :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/scrutins/:uid — détail d'un scrutin avec la map des votants
router.get('/:uid', async (req, res) => {
    try {
        const row = await Vote.findByUidWithVotants(req.params.uid);
        if (!row) return res.status(404).json({ error: 'Scrutin introuvable' });
        res.json({ ...serialize(row), votantsMap: row.votantsMap });
    } catch (err) {
        console.error('Erreur GET /api/scrutins/:uid :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
