import pool from '../dbManager.js';
import Parti from '../models/Parti.js';

const partis = [
    { abrev: 'LFI', nom: 'La France insoumise', couleur: '#cc2443', couleur2: '#f0504e', logo: '/partis/lfi-nfp.png', ordre: 1 },
    { abrev: 'ECOS', nom: 'Écologiste et Social', couleur: '#00c000', couleur2: '#ffdd00', logo: '/partis/ecos.webp', ordre: 2 },
    { abrev: 'GDR', nom: 'Gauche Démocrate et Républicaine', couleur: '#dd0000', couleur2: '#8b0000', logo: '/partis/gdr.png', ordre: 3 },
    { abrev: 'SOC', nom: 'Socialistes et apparentés', couleur: '#e4032e', couleur2: '#f7a1b0', logo: '/partis/soc.jpeg', ordre: 4 },
    { abrev: 'DEM', nom: 'Les Démocrates', couleur: '#ff9900', couleur2: '#005bac', logo: '/partis/dem.jpeg', ordre: 5 },
    { abrev: 'HOR', nom: 'Horizons & Indépendants', couleur: '#0099cc', couleur2: '#00d2ff', logo: '/partis/hor.jpg', ordre: 6 },
    { abrev: 'EPR', nom: 'Ensemble pour la République', couleur: '#ffcc00', couleur2: '#003189', logo: '/partis/epr.png', ordre: 7 },
    { abrev: 'DR', nom: 'Droite Républicaine', couleur: '#0066cc', couleur2: '#ffffff', logo: '/partis/dr.png', ordre: 8 },
    { abrev: 'LIOT', nom: 'Libertés, Indépendants, Outre-mer et Territoires', couleur: '#5ba4cf', couleur2: '#f4a300', logo: '/partis/liot.png', ordre: 9 },
    { abrev: 'UDDPLR', nom: 'Union des droites pour la République', couleur: '#1a2d5a', couleur2: '#c8102e', logo: '/partis/uddplr.png', ordre: 10 },
    { abrev: 'RN', nom: 'Rassemblement National', couleur: '#0d3b66', couleur2: '#c8102e', logo: '/partis/rn.png', ordre: 11 },
    { abrev: 'NI', nom: 'Non inscrit', couleur: '#aaaaaa', couleur2: '#666666', logo: null, ordre: 12 },
];

const run = async () => {
    try {
        console.log(`Import de ${partis.length} partis...`);
        await Parti.upsertMany(partis);
        console.log('Import des partis terminé.');
    } catch (err) {
        console.error('Erreur lors du seed partis :', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

run();
