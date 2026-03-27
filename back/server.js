import 'dotenv/config';
import express from 'express';
import nunjucks from 'nunjucks';
import { fileURLToPath } from 'url';
import path from 'path';
import indexRouter from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

nunjucks.configure(path.join(__dirname, '../views'), {
    autoescape: true,
    express: app
});

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

app.use('/', indexRouter);

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
