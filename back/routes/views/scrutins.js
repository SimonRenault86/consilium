import { Router } from 'express';
import Vote from '../../db/models/Vote.js';
import { groupes, groupeOrdreGaucheaDroite } from '../../../front/helpers/partis.js';
import { formatDate, safeJsonLd } from './_shared.js';

const router = Router();

router.get('/scrutins', (req, res) => {
    const groupesList = Object.keys(groupeOrdreGaucheaDroite)
        .sort((a, b) => groupeOrdreGaucheaDroite[a] - groupeOrdreGaucheaDroite[b])
        .map(abrev => ({
            abrev,
            nom: groupes[abrev]?.nom || abrev,
            logo: groupes[abrev]?.logo || null,
            couleur: groupes[abrev]?.couleur || '#aaaaaa',
        }));

    const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    res.render('scrutins.njk', {
        title: 'Scrutins — Consilium',
        description: "Retrouvez tous les scrutins et votes de l'Assemblée Nationale française : résultats, détail des positions par groupe politique.",
        canonicalUrl: `${siteUrl}/scrutins`,
        groupes: groupesList
    });
});

router.get('/scrutin/:uid', async (req, res) => {
    const { uid } = req.params;
    try {
        const vote = await Vote.findByUid(uid);
        if (!vote) {
            return res.status(404).render('scrutin.njk', {
                title: 'Scrutin introuvable — Consilium',
                uid,
                vote: null,
            });
        }
        const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
        const pageUrl = `${siteUrl}/scrutin/${vote.uid}`;
        const dateFormatee = formatDate(vote.date_scrutin);
        const titrePropre = vote.titre ? vote.titre.replace(/\.+$/, '') : null;
        const description = `Scrutin n°${vote.numero}${dateFormatee ? ` du ${dateFormatee}` : ''}${titrePropre ? ` — ${titrePropre}` : ''}. Résultat : ${vote.sort}.`;

        const schemaJson = safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: `Scrutin n°${vote.numero} — ${vote.titre}`,
            description: description,
            startDate: vote.date_scrutin
                ? (vote.date_scrutin instanceof Date
                    ? vote.date_scrutin.toISOString().slice(0, 10)
                    : String(vote.date_scrutin).slice(0, 10))
                : undefined,
            location: { '@type': 'Place', name: 'Assemblée Nationale, Paris' },
            organizer: { '@type': 'Organization', name: 'Assemblée Nationale', url: 'https://www.assemblee-nationale.fr' },
            url: pageUrl,
            eventStatus: 'https://schema.org/EventScheduled',
        });

        res.render('scrutin.njk', {
            title: `Scrutin n°${vote.numero} — Consilium`,
            description,
            canonicalUrl: pageUrl,
            schemaJson,
            uid,
            vote: {
                uid: vote.uid,
                numero: vote.numero,
                sort: vote.sort,
                titre: vote.titre,
                dateFormatee,
            },
        });
    } catch (err) {
        console.error('Erreur GET /scrutin/:uid :', err);
        res.status(500).render('scrutin.njk', { title: 'Erreur — Consilium', uid, vote: null });
    }
});

export default router;
