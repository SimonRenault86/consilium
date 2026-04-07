import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    res.render('home.njk', {
        title: 'Consilium — Assemblée Nationale',
        description: "Visualisez les 577 sièges de l'hémicycle et explorez les votes, positions et fiches des députés de l'Assemblée Nationale française.",
        canonicalUrl: siteUrl + '/',
    });
});

router.get('/robots.txt', (req, res) => {
    const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    res.set('Content-Type', 'text/plain');
    res.send([
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${siteUrl}/sitemap.xml`,
    ].join('\n'));
});

export default router;
