import { Router } from 'express';
import { groupes, groupeOrdreGaucheaDroite } from '../../../front/helpers/partis.js';
import { toSlug } from './_shared.js';
import Depute from '../../db/models/Depute.js';

const router = Router();

router.get('/partis', async (req, res) => {
    const rows = await Depute.findAll();
    const groupesData = Object.keys(groupeOrdreGaucheaDroite)
        .sort((a, b) => groupeOrdreGaucheaDroite[a] - groupeOrdreGaucheaDroite[b])
        .map(abrev => {
            const info = groupes[abrev];
            const membres = rows
                .filter(d => d.groupe_abrev === abrev)
                .map(d => ({
                    id: d.id,
                    prenom: d.prenom,
                    nom: d.nom,
                    departementNom: d.departement_nom,
                    slug: toSlug(`${d.prenom} ${d.nom}`),
                    initiales: `${d.prenom[0]}${d.nom[0]}`
                }));
            if (!membres.length) return null;
            return {
                abrev,
                nom: info?.nom || abrev,
                logo: info?.logo || null,
                deputes: membres
            };
        })
        .filter(Boolean);

    const totalDeputes = groupesData.reduce((acc, g) => acc + g.deputes.length, 0);

    res.render('partis.njk', {
        title: 'Groupes politiques — Consilium',
        groupes: groupesData,
        totalDeputes
    });
});

router.get('/partis/:abrev', async (req, res) => {
    const abrev = req.params.abrev.toUpperCase();
    const info = groupes[abrev];

    if (!info) {
        return res.status(404).render('parti.njk', {
            title: 'Groupe introuvable — Consilium',
            parti: null,
        });
    }

    const membres = await Depute.findByGroupe(abrev);
    const deputes = membres.map(d => ({
        id: d.id,
        prenom: d.prenom,
        nom: d.nom,
        departementNom: d.departement_nom,
        slug: toSlug(`${d.prenom} ${d.nom}`),
        initiales: `${d.prenom[0]}${d.nom[0]}`,
    }));

    res.render('parti.njk', {
        title: `${info.nom} — Consilium`,
        parti: {
            abrev,
            nom: info.nom,
            logo: info.logo || null,
            couleur: info.couleur || '#aaaaaa',
            nbDeputes: deputes.length,
        },
        deputes,
    });
});

export default router;
