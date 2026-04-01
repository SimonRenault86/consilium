import { Router } from 'express';
import openApiSpec from './api/openapi.js';
import deputesRouter from './api/deputes.js';
import scrutinsRouter from './api/scrutins.js';
import partisRouter from './api/partis.js';
import amendementsRouter from './api/amendements.js';
import ministresRouter from './api/ministres.js';
import qagsRouter from './api/qags.js';

const router = Router();

router.get('/openapi.json', (req, res) => res.json(openApiSpec));
router.use('/deputes', deputesRouter);
router.use('/scrutins', scrutinsRouter);
router.use('/partis', partisRouter);
router.use('/amendements', amendementsRouter);
router.use('/ministres', ministresRouter);
router.use('/qags', qagsRouter);

export default router;
