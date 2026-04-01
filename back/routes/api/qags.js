import { Router } from 'express';
import Qag from '../../db/models/Qag.js';
import pool from '../../db/dbManager.js';

const router = Router();

const serializeSession = row => ({
    dateSeance: row.date_seance,
    nbQuestions: row.nb_questions,
});

const serializeQag = row => ({
    uid: row.uid,
    numero: row.numero,
    dateSeance: row.date_seance,
    rubrique: row.rubrique,
    analyse: row.sujet,
    auteur: {
        ref: row.acteur_ref,
        prenom: row.auteur_prenom || null,
        nom: row.auteur_nom || null,
        civ: row.auteur_civ || null,
    },
    groupe: {
        ref: row.groupe_ref,
        abrev: row.groupe_abrev,
        developpe: row.groupe_developpe,
    },
    ministre: {
        ref: row.min_ref,
        abrege: row.min_abrege,
        developpe: row.min_developpe,
        acteurId: row.min_acteur_id || null,
        prenom: row.min_prenom || null,
        nom: row.min_nom || null,
    },
    texteReponse: row.texte_reponse,
    codeCloture: row.code_cloture,
});

// GET /api/qags/last-update
router.get('/last-update', async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT executed_at FROM seed_logs WHERE categorie = 'qags' ORDER BY executed_at DESC LIMIT 1"
        );
        res.json({ lastUpdate: rows[0]?.executed_at || null });
    } catch (err) {
        console.error('Erreur GET /api/qags/last-update :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/qags/sessions — liste des sessions par date
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await Qag.findSessions();
        res.json(sessions.map(serializeSession));
    } catch (err) {
        console.error('Erreur GET /api/qags/sessions :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/qags?date=2024-10-03 — questions d'une session
router.get('/', async (req, res) => {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Paramètre date requis (format YYYY-MM-DD)' });
    }
    try {
        const qags = await Qag.findByDate(date);
        res.json(qags.map(serializeQag));
    } catch (err) {
        console.error('Erreur GET /api/qags :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/qags/groupe/:abrev?limit=5 — dernières QaG d'un groupe
router.get('/groupe/:abrev', async (req, res) => {
    const { abrev } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '5', 10), 20);
    try {
        const qags = await Qag.findByGroupe(abrev, limit);
        res.json(qags.map(serializeQag));
    } catch (err) {
        console.error('Erreur GET /api/qags/groupe/:abrev :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/qags/depute/:id?limit=5 — dernières QaG d'un député
router.get('/depute/:id', async (req, res) => {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '5', 10), 20);
    try {
        const qags = await Qag.findByActeur(id, limit);
        res.json(qags.map(serializeQag));
    } catch (err) {
        console.error('Erreur GET /api/qags/depute/:id :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
