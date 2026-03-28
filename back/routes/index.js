import { Router } from 'express';
import apiRouter from './api.js';
import viewsRouter from './views.js';

const router = Router();

router.use('/api', apiRouter);
router.use('/', viewsRouter);

export default router;
