import { groupes, getLogoUrl } from '@/helpers/partis.js';
import deputesBrut from '@/helpers/brut/deputes.json';

export { groupes, getLogoUrl };

// Génère un slug URL-friendly à partir du prénom et du nom
const toSlug = text =>
    text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

// Retourne l'URL de la photo d'un élu selon son slug (/elus/{slug}.jpg)
// Retourne null si le slug est absent — le composant affichera les initiales
export const getPhotoUrl = depute => depute?.slug ? `/elus/${depute.slug}.jpg` : null;

// Construit la map seatId → député à partir du JSON
const deputesMap = new Map();

for (const d of deputesBrut) {
    deputesMap.set(d.__id, {
        ...d,
        seatId: d.__id,
        slug: toSlug(`${d.prenom} ${d.nom}`),
        groupe: d.groupeAbrev,
    });
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
