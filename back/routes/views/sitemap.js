import { Router } from 'express';
import Depute from '../../db/models/Depute.js';
import Vote from '../../db/models/Vote.js';
import { groupes } from '../../../front/helpers/partis.js';
import { toSlug } from './_shared.js';

const router = Router();

const xmlEscape = s => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const urlEntry = ({ loc, lastmod, changefreq, priority }) => {
    let entry = `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n`;
    if (lastmod) entry += `    <lastmod>${lastmod}</lastmod>\n`;
    if (changefreq) entry += `    <changefreq>${changefreq}</changefreq>\n`;
    if (priority) entry += `    <priority>${priority}</priority>\n`;
    entry += '  </url>';
    return entry;
};

router.get('/sitemap.xml', async (req, res) => {
    const siteUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;

    try {
        const [deputes, scrutinUids] = await Promise.all([
            Depute.findAll(),
            Vote.findAllUids(),
        ]);

        const today = new Date().toISOString().slice(0, 10);

        const staticUrls = [
            { loc: `${siteUrl}/`, changefreq: 'daily', priority: '1.0', lastmod: today },
            { loc: `${siteUrl}/scrutins`, changefreq: 'daily', priority: '0.9', lastmod: today },
            { loc: `${siteUrl}/partis`, changefreq: 'weekly', priority: '0.8' },
            { loc: `${siteUrl}/outils/majorite-builder`, changefreq: 'monthly', priority: '0.5' },
        ];

        const partiUrls = Object.keys(groupes).map(abrev => ({
            loc: `${siteUrl}/partis/${abrev}`,
            changefreq: 'weekly',
            priority: '0.7',
        }));

        const deputeUrls = deputes.map(d => ({
            loc: `${siteUrl}/depute/${toSlug(`${d.prenom} ${d.nom}`)}`,
            changefreq: 'weekly',
            priority: '0.6',
        }));

        const scrutinUrls = scrutinUids.map(s => {
            const lastmod = s.date_scrutin
                ? (s.date_scrutin instanceof Date
                    ? s.date_scrutin.toISOString().slice(0, 10)
                    : String(s.date_scrutin).slice(0, 10))
                : undefined;
            return {
                loc: `${siteUrl}/scrutin/${s.uid}`,
                lastmod,
                changefreq: 'never',
                priority: '0.5',
            };
        });

        const allUrls = [...staticUrls, ...partiUrls, ...deputeUrls, ...scrutinUrls];

        const xml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...allUrls.map(urlEntry),
            '</urlset>',
        ].join('\n');

        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.send(xml);
    } catch (err) {
        console.error('Erreur GET /sitemap.xml :', err);
        res.status(500).send('Erreur lors de la génération du sitemap.');
    }
});

export default router;
