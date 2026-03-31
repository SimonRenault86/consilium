import { Router } from 'express';
import Amendement from '../../db/models/Amendement.js';
import pool from '../../db/dbManager.js';

const router = Router();

const decodeEntities = str => str
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

const stripHtml = html => {
    if (!html) return null;
    return decodeEntities(html.replace(/<[^>]*>/g, '')).trim();
};

const serialize = row => ({
    uid: row.uid,
    legislature: row.legislature,
    numeroLong: row.numero_long,
    dateDepot: row.date_depot instanceof Date
        ? row.date_depot.toISOString().slice(0, 10)
        : row.date_depot ? String(row.date_depot).slice(0, 10) : null,
    datePublication: row.date_publication instanceof Date
        ? row.date_publication.toISOString().slice(0, 10)
        : row.date_publication ? String(row.date_publication).slice(0, 10) : null,
    articleTitre: row.article_titre,
    articleDesignation: row.article_designation,
    dispositif: stripHtml(row.dispositif),
    exposeSommaire: stripHtml(row.expose_sommaire),
    sort: row.sort,
    etat: row.etat,
    sousEtat: row.sous_etat,
    categorie: row.categorie_nom ? {
        nom: row.categorie_nom,
        couleur: row.categorie_couleur,
    } : null,
    sousCategorie: row.sous_categorie_nom ? {
        nom: row.sous_categorie_nom,
    } : null,
    auteur: row.auteur_prenom ? {
        ref: row.auteur_ref,
        nom: `${row.auteur_prenom} ${row.auteur_nom}`,
        groupe: row.auteur_groupe,
    } : null,
    texteLegislatifRef: row.texte_legislatif_ref,
});

// GET /api/amendements/last-update
router.get('/last-update', async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT executed_at FROM seed_logs WHERE categorie = 'amendements' ORDER BY executed_at DESC LIMIT 1"
        );
        res.json({ lastUpdate: rows[0]?.executed_at || null });
    } catch (err) {
        console.error('Erreur GET /api/amendements/last-update :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/amendements?from=&to=&limit=&q=&sort=
router.get('/', async (req, res) => {
    const { from, to, limit = '10', q, sort } = req.query;

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if ((from && !dateRe.test(from)) || (to && !dateRe.test(to))) {
        return res.status(400).json({ error: 'Format de date invalide' });
    }

    try {
        const rows = await Amendement.findAll({
            from: from || null,
            to: to || null,
            limit: parseInt(limit, 10) || 10,
            q: q ? String(q).trim() : null,
            sort: sort ? String(sort).trim() : null,
        });
        res.json(rows.map(serialize));
    } catch (err) {
        console.error('Erreur GET /api/amendements :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/amendements/:uid — détail avec signataires
router.get('/:uid', async (req, res) => {
    try {
        const row = await Amendement.findByUidWithSignataires(req.params.uid);
        if (!row) return res.status(404).json({ error: 'Amendement introuvable' });
        res.json({ ...serialize(row), signatairesMap: row.signatairesMap });
    } catch (err) {
        console.error('Erreur GET /api/amendements/:uid :', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
