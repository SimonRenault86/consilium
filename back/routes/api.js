import { Router } from 'express';
import openApiSpec from './api/openapi.js';
import deputesRouter from './api/deputes.js';
import scrutinsRouter from './api/scrutins.js';
import partisRouter from './api/partis.js';

const router = Router();

router.get('/openapi.json', (req, res) => res.json(openApiSpec));
router.use('/deputes', deputesRouter);
router.use('/scrutins', scrutinsRouter);
router.use('/partis', partisRouter);

export default router;
