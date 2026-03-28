import { Router } from 'express';
import openApiSpec from './api/openapi.js';
import deputesRouter from './api/deputes.js';
import votesRouter from './api/votes.js';

const router = Router();

router.get('/openapi.json', (req, res) => res.json(openApiSpec));
router.use('/deputes', deputesRouter);
router.use('/votes', votesRouter);

export default router;
