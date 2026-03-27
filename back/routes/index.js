import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.render('home.njk', {
        title: 'Politica — Assemblée Nationale'
    });
});

router.get('/elu/:slug', (req, res) => {
    const { slug } = req.params;
    res.render('elu.njk', {
        title: `Élu — ${slug}`,
        slug
    });
});

export default router;
