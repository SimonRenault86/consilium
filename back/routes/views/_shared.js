import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const deputes = JSON.parse(
    readFileSync(path.join(__dirname, '../../../front/helpers/brut/deputes.json'), 'utf8')
);

export const toSlug = text =>
    text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const formatDate = dateStr => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};
