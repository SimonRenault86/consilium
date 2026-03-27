import { groupes, getLogoUrl } from '@/helpers/partis.js';

export { groupes, getLogoUrl };

// Retourne l'URL de la photo d'un élu selon son slug (/elus/{slug}.jpg)
// Retourne null si le slug est absent — le composant affichera les initiales
export const getPhotoUrl = depute => depute?.slug ? `/elus/${depute.slug}.jpg` : null;

// Placeholder : associe un seatId à un député
// À terme, cette map sera alimentée par une BDD ou une API open data
const deputesMap = new Map();

// Exemple de quelques députés pour tester
const exemples = [
    { seatId: 1, nom: 'Piquemal', prenom: 'François', slug: 'francois-piquemal', groupe: 'LFI' },
    { seatId: 2, nom: 'Dupont', prenom: 'Marie', slug: 'marie-dupont', groupe: 'ENS' },
    { seatId: 100, nom: 'Martin', prenom: 'Jean', slug: 'jean-martin', groupe: 'RN' },
    { seatId: 200, nom: 'Durand', prenom: 'Claire', slug: 'claire-durand', groupe: 'LR' },
    { seatId: 300, nom: 'Leroy', prenom: 'Pierre', slug: 'pierre-leroy', groupe: 'SOC' },
    { seatId: 400, nom: 'Bernard', prenom: 'Sophie', slug: 'sophie-bernard', groupe: 'ECO' },
    { seatId: 500, nom: 'Moreau', prenom: 'Lucas', slug: 'lucas-moreau', groupe: 'DEM' }
];

for (const depute of exemples) {
    deputesMap.set(depute.seatId, depute);
}

export const getDepute = seatId => deputesMap.get(seatId) || null;

export const getCouleurSiege = seatId => {
    const depute = getDepute(seatId);
    if (!depute) return '#d1d5db';
    return groupes[depute.groupe]?.couleur || '#d1d5db';
};

export const getCouleur2Siege = seatId => {
    const depute = getDepute(seatId);
    if (!depute) return '#9ca3af';
    return groupes[depute.groupe]?.couleur2 || '#9ca3af';
};

export default deputesMap;
