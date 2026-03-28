import { Router } from 'express';
import Vote from '../../db/models/Vote.js';

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
    typeVote: row.code_type_vote ? { code: row.code_type_vote, libelle: row.type_vote_libelle } : null,
    typeMajorite: row.type_majorite || null,
    synthese: {
        votants: row.nb_votants,
        pour: row.nb_pour,
        contre: row.nb_contre,
        abstentions: row.nb_abstentions,
    },
});

// GET /api/votes?from=&to=&limit=&q=
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
        console.error('Erreur GET /api/votes :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/votes/:uid — détail d'un scrutin avec la map des votants
router.get('/:uid', async (req, res) => {
    try {
        const row = await Vote.findByUidWithVotants(req.params.uid);
        if (!row) return res.status(404).json({ error: 'Vote introuvable' });
        res.json({ ...serialize(row), votantsMap: row.votantsMap });
    } catch (err) {
        console.error('Erreur GET /api/votes/:uid :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
