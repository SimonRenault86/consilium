import { Router } from 'express';

const router = Router();

router.get('/outils/majorite-builder', (req, res) => {
    const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    res.render('majorite-builder.njk', {
        title: 'Majorité Builder — Consilium',
        description: 'Composez une coalition sur mesure parmi les groupes politiques de l\'Assemblée Nationale et vérifiez si elle atteint la majorité absolue de 289 sièges.',
        canonicalUrl: `${siteUrl}/outils/majorite-builder`,
    });
});

export default router;
