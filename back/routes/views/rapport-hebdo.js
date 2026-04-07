import { Router } from 'express';
import RapportHebdo from '../../db/models/RapportHebdo.js';

const router = Router();

// GET /semaine — dernier rapport (redirige vers /semaine/:date)
router.get('/semaine', async (req, res) => {
    try {
        const latest = await RapportHebdo.findLatest();
        if (!latest) {
            return res.render('rapport-hebdo.njk', {
                title: 'Rapport hebdomadaire — Consilium',
                description: 'Le résumé hebdomadaire de l\'activité de l\'Assemblée Nationale, généré par IA.',
                rapport: null,
                semaines: [],
                semaineActuelle: null,
            });
        }
        return res.redirect(`/semaine/${latest.semaineDebut}`);
    } catch (err) {
        console.error('Erreur GET /semaine :', err);
        res.status(500).render('rapport-hebdo.njk', {
            title: 'Rapport hebdomadaire — Consilium',
            rapport: null,
            semaines: [],
            semaineActuelle: null,
        });
    }
});

// GET /semaine/:date — rapport d'une semaine précise
router.get('/semaine/:date', async (req, res) => {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(404).render('rapport-hebdo.njk', {
            title: 'Rapport introuvable — Consilium',
            rapport: null,
            semaines: [],
            semaineActuelle: null,
        });
    }

    try {
        const [rapport, semaines] = await Promise.all([
            RapportHebdo.findBySemaine(date),
            RapportHebdo.findSemaines(),
        ]);

        const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;

        if (!rapport) {
            return res.status(404).render('rapport-hebdo.njk', {
                title: 'Rapport introuvable — Consilium',
                rapport: null,
                semaines,
                semaineActuelle: date,
                canonicalUrl: `${siteUrl}/semaine/${date}`,
            });
        }

        const semaineFin = new Date(rapport.semaineFin);
        const semaineDebut = new Date(rapport.semaineDebut);
        const fmt = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const titre = `Semaine du ${fmt(semaineDebut)} — Consilium`;
        const description = rapport.narratif
            ? rapport.narratif.slice(0, 160).replace(/\n/g, ' ')
            : `Résumé parlementaire de la semaine du ${fmt(semaineDebut)} au ${fmt(semaineFin)}.`;

        res.render('rapport-hebdo.njk', {
            title: titre,
            description,
            canonicalUrl: `${siteUrl}/semaine/${date}`,
            rapport,
            semaines,
            semaineActuelle: date,
        });
    } catch (err) {
        console.error('Erreur GET /semaine/:date :', err);
        res.status(500).render('rapport-hebdo.njk', {
            title: 'Erreur — Consilium',
            rapport: null,
            semaines: [],
            semaineActuelle: date,
        });
    }
});

export default router;
