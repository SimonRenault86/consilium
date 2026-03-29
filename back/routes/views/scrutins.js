import { Router } from 'express';
import Vote from '../../db/models/Vote.js';
import { groupes, groupeOrdreGaucheaDroite } from '../../../front/helpers/partis.js';

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

    res.render('scrutins.njk', { title: 'Scrutins — Consilium', groupes: groupesList });
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
        res.render('scrutin.njk', {
            title: `Scrutin n°${vote.numero} — Consilium`,
            uid,
            vote: {
                uid: vote.uid,
                numero: vote.numero,
                sort: vote.sort,
            },
        });
    } catch (err) {
        console.error('Erreur GET /scrutin/:uid :', err);
        res.status(500).render('scrutin.njk', { title: 'Erreur — Consilium', uid, vote: null });
    }
});

export default router;
