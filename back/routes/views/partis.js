import { Router } from 'express';
import { groupes, groupeOrdreGaucheaDroite } from '../../../front/helpers/partis.js';
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
                    slug: d.slug,
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

export default router;
