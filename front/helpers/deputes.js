import { groupes, getLogoUrl, groupeOrdreGaucheaDroite } from '@/helpers/partis.js';
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
// On trie par groupe (gauche → droite) pour que les sièges reflètent l'hémicycle réel
const deputesTries = [...deputesBrut].sort((a, b) => {
    const ordreA = groupeOrdreGaucheaDroite[a.groupeAbrev] ?? 99;
    const ordreB = groupeOrdreGaucheaDroite[b.groupeAbrev] ?? 99;
    return ordreA - ordreB;
});

const deputesMap = new Map();

deputesTries.forEach((d, index) => {
    const seatId = index + 1;
    deputesMap.set(seatId, {
        ...d,
        seatId,
        slug: toSlug(`${d.prenom} ${d.nom}`),
        groupe: d.groupeAbrev,
    });
});

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

// Normalise un score brut selon les seuils propres à chaque champ (résultat entre 0 et 1)
// - scoreLoyaute   : >= 95 % → loyal (1), en dessous dégradé vers rouge
// - scoreParticipation : < 25 % → faible (0), > 40 % → haute (1), dégradé entre les deux
const normaliserScore = (score, champ) => {
    if (score === null || score === undefined) return null;
    if (champ === 'scoreLoyaute') return Math.min(1, Math.pow(score / 0.95, 3));
    if (champ === 'scoreParticipation') {
        if (score <= 0.15) return 0;
        if (score >= 0.25) return 1;
        return (score - 0.15) / 0.10;
    }
    return Math.max(0, Math.min(1, score));
};

const scoreToCouleur = t => {
    if (t === null || t === undefined) return '#d1d5db';
    const clamped = Math.max(0, Math.min(1, t));
    const r = Math.round(239 + (34 - 239) * clamped);
    const g = Math.round(68 + (197 - 68) * clamped);
    const b = Math.round(68 + (94 - 68) * clamped);
    return `rgb(${r}, ${g}, ${b})`;
};

export const getCouleurScoreSiege = (seatId, champ) => {
    const depute = getDepute(seatId);
    if (!depute) return '#d1d5db';
    return scoreToCouleur(normaliserScore(depute[champ], champ));
};

// Statistiques agrégées par groupe, triées gauche → droite
export const statsParGroupe = Object.keys(groupeOrdreGaucheaDroite).map(abrev => {
    const deputes = [...deputesMap.values()].filter(d => d.groupe === abrev);
    if (!deputes.length) return null;

    const moyenne = champ => {
        const valeurs = deputes.map(d => d[champ]).filter(v => v !== null && v !== undefined);
        if (!valeurs.length) return null;
        return valeurs.reduce((acc, v) => acc + v, 0) / valeurs.length;
    };

    return {
        abrev,
        nom: groupes[abrev]?.nom,
        couleur: groupes[abrev]?.couleur,
        logo: groupes[abrev]?.logo,
        nombreDeputes: deputes.length,
        scoreLoyaute: moyenne('scoreLoyaute'),
        scoreParticipation: moyenne('scoreParticipation'),
    };
}).filter(Boolean);

export { normaliserScore, scoreToCouleur };

// Liste plate de tous les députés (utile pour la recherche)
export const tousLesDeputes = [...deputesMap.values()];

export default deputesMap;
