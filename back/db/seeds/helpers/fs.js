import { readdirSync, createWriteStream, rmSync } from 'fs';
import http from 'http';
import https from 'https';

/**
 * Télécharge un fichier depuis une URL (suit les redirections 301/302).
 * @param {string} url
 * @param {string} dest - Chemin local de destination
 */
export const downloadFile = (url, dest) => new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = createWriteStream(dest);

    const req = protocol.get(url, response => {
        if (response.statusCode === 301 || response.statusCode === 302) {
            file.close();
            rmSync(dest, { force: true });
            downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            return;
        }
        if (response.statusCode !== 200) {
            file.close();
            rmSync(dest, { force: true });
            reject(new Error(`Téléchargement échoué : status ${response.statusCode}`));
            return;
        }
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', reject);
    });

    req.on('error', err => {
        rmSync(dest, { force: true });
        reject(err);
    });
});

/**
 * Retourne récursivement tous les fichiers .json d'un répertoire.
 * @param {string} dir
 * @returns {string[]}
 */
export const findJsonFiles = dir => {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
            results.push(...findJsonFiles(fullPath));
        } else if (entry.name.endsWith('.json')) {
            results.push(fullPath);
        }
    }
    return results;
};
