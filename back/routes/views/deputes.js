import { Router } from 'express';
import { groupes } from '../../../front/helpers/partis.js';
import { toSlug, formatDate, safeJsonLd } from './_shared.js';
import Depute from '../../db/models/Depute.js';

const router = Router();

router.get('/depute/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const r = await Depute.findBySlug(slug);

        if (!r) {
            return res.status(404).render('depute.njk', {
                title: 'Député introuvable — Consilium',
                slug,
                depute: null,
                groupe: null,
                hatvpUrl: null,
                mandatPrincipal: null,
                commissions: [],
                deputesSimilaires: [],
            });
        }

        const depute = {
            ...Depute.parse(r),
            slug,
            naissanceFormatee: formatDate(r.naissance),
            priseFonctionFormatee: formatDate(r.date_prise_fonction),
            scoreParticipationPct: r.score_participation != null
                ? Math.round(parseFloat(r.score_participation) * 100)
                : null,
            scoreLoyautePct: r.score_loyaute != null
                ? Math.round(parseFloat(r.score_loyaute) * 100)
                : null,
        };

        const commissions = await Depute.findCommissionsByDepute(r.id);
        const groupe = groupes[r.groupe_abrev] || null;

        const similairesRows = await Depute.findByDepartement(r.departement_code);
        let memeZone = similairesRows.filter(d => d.id !== r.id);
        if (memeZone.length < 3) {
            const autresRows = await Depute.findAll();
            const memeRegion = autresRows.filter(d =>
                d.departement_code !== r.departement_code && d.id !== r.id
            );
            memeZone = [...memeZone, ...memeRegion];
        }
        for (let i = memeZone.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [memeZone[i], memeZone[j]] = [memeZone[j], memeZone[i]];
        }
        const deputesSimilaires = memeZone.slice(0, 3).map(d => ({
            prenom: d.prenom,
            nom: d.nom,
            slug: toSlug(`${d.prenom} ${d.nom}`),
            photoUrl: `/elus/${d.id}.jpg`,
            initiales: `${d.prenom[0]}${d.nom[0]}`,
        }));

        const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
        const pageUrl = `${siteUrl}/depute/${slug}`;
        const photoUrl = `${siteUrl}/elus/${depute.id}.jpg`;
        const description = `${depute.civ} ${depute.prenom} ${depute.nom}, député${depute.civ === 'Mme' ? 'e' : ''} de ${depute.departementNom} (circonscription ${depute.circo})${groupe ? `, groupe ${groupe.nom}` : ''}. Découvrez ses votes et son activité à l'Assemblée Nationale.`;

        const schemaJson = safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: `${depute.prenom} ${depute.nom}`,
            jobTitle: 'Député',
            image: photoUrl,
            url: pageUrl,
            ...(groupe && { memberOf: { '@type': 'Organization', name: groupe.nom } }),
            ...(depute.naissance && { birthDate: String(depute.naissance).slice(0, 10) }),
        });

        res.render('depute.njk', {
            title: `${depute.civ} ${depute.prenom} ${depute.nom} — Consilium`,
            description,
            canonicalUrl: pageUrl,
            ogImage: photoUrl,
            schemaJson,
            slug,
            depute,
            groupe,
            hatvpUrl: depute.hatvpUrl,
            mandatPrincipal: depute.mandatPrincipal,
            commissions,
            deputesSimilaires,
        });
    } catch (err) {
        console.error('Erreur GET /depute/:slug :', err);
        res.status(500).render('depute.njk', {
            title: 'Erreur — Consilium',
            depute: null,
            groupe: null,
            hatvpUrl: null,
            mandatPrincipal: null,
            commissions: [],
            deputesSimilaires: [],
        });
    }
});

export default router;
