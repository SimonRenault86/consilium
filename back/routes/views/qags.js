import { Router } from 'express';
import { formatDate, safeJsonLd } from './_shared.js';

const router = Router();

// GET /qags — liste des sessions
router.get('/qags', (req, res) => {
    const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    res.render('qags.njk', {
        title: 'Questions au Gouvernement — Consilium',
        description: "Retrouvez toutes les sessions de Questions au Gouvernement (QaG) de l'Assemblée Nationale : questions des députés et réponses des ministres.",
        canonicalUrl: `${siteUrl}/qags`,
    });
});

// GET /qag/:date — session d'une date
router.get('/qag/:date', (req, res) => {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(404).render('qag.njk', {
            title: 'Session introuvable — Consilium',
            date: null,
            dateFormatee: null,
        });
    }

    const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    const dateFormatee = formatDate(date);
    const description = `Questions au Gouvernement du ${dateFormatee} — Questions des députés et réponses des ministres.`;

    const schemaJson = safeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: `Questions au Gouvernement du ${dateFormatee}`,
        description,
        startDate: date,
        location: { '@type': 'Place', name: 'Assemblée Nationale, Paris' },
        organizer: { '@type': 'Organization', name: 'Assemblée Nationale', url: 'https://www.assemblee-nationale.fr' },
        url: `${siteUrl}/qag/${date}`,
        eventStatus: 'https://schema.org/EventScheduled',
    });

    res.render('qag.njk', {
        title: `QaG du ${dateFormatee} — Consilium`,
        description,
        canonicalUrl: `${siteUrl}/qag/${date}`,
        schemaJson,
        date,
        dateFormatee,
    });
});

export default router;
