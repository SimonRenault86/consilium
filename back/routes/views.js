import { Router } from 'express';
import homeRouter from './views/home.js';
import partisRouter from './views/partis.js';
import deputesRouter from './views/deputes.js';
import scrutinsRouter from './views/scrutins.js';

const router = Router();

router.use('/', homeRouter);
router.use('/', partisRouter);
router.use('/', deputesRouter);
router.use('/', scrutinsRouter);

export default router;
