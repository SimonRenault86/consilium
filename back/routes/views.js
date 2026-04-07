import { Router } from 'express';
import homeRouter from './views/home.js';
import partisRouter from './views/partis.js';
import deputesRouter from './views/deputes.js';
import scrutinsRouter from './views/scrutins.js';
import outilsRouter from './views/outils.js';
import sitemapRouter from './views/sitemap.js';
import qagsRouter from './views/qags.js';
import rapportHebdoRouter from './views/rapport-hebdo.js';

const router = Router();

router.use('/', homeRouter);
router.use('/', partisRouter);
router.use('/', deputesRouter);
router.use('/', scrutinsRouter);
router.use('/', outilsRouter);
router.use('/', sitemapRouter);
router.use('/', qagsRouter);
router.use('/', rapportHebdoRouter);

export default router;
