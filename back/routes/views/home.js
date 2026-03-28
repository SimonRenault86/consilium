import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.render('home.njk', {
        title: 'Consilium — Assemblée Nationale'
    });
});

router.get('/api-doc', (req, res) => {
    res.render('api-doc.njk', {
        title: 'API — Consilium'
    });
});

export default router;
