import { Router } from 'express';

const router = Router();

router.get('/outils/majorite-builder', (req, res) => {
    res.render('majorite-builder.njk', { title: 'Majorité Builder — Consilium' });
});

export default router;
