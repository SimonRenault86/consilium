import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import nunjucks from 'nunjucks';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import path from 'path';
import indexRouter from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

// Lecture du manifest Vite pour les noms de fichiers hashés
const manifestPath = path.join(__dirname, '../public/dist/.vite/manifest.json');
const assetsFallback = { js: '/dist/main.js', css: '/dist/main.css' };

const readManifest = () => {
    try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        const entry = manifest['front/main.js'];
        if (entry) {
            return {
                js: `/dist/${entry.file}`,
                css: entry.css?.length ? `/dist/${entry.css[0]}` : assetsFallback.css,
            };
        }
    } catch {
        // manifest absent (build en cours)
    }
    return { ...assetsFallback };
};

// En prod : lecture unique au démarrage. En dev : lecture à chaque requête pour suivre les rebuilds Vite.
const assetsStatic = isProd ? readManifest() : null;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
    contentSecurityPolicy: false, // Vue + CDN fonts nécessitent une config fine — à activer plus tard
}));

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, réessayez dans une minute.' },
});
app.use('/api', apiLimiter);

nunjucks.configure(path.join(__dirname, '../views'), {
    autoescape: true,
    express: app,
    noCache: !isProd,
});

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Injecter les chemins d'assets dans tous les templates
app.use((req, res, next) => {
    res.locals.assets = isProd ? assetsStatic : readManifest();
    next();
});

app.use('/', indexRouter);

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
