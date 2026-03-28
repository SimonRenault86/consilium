import { shallowRef, computed } from 'vue';
import { groupes, getLogoUrl, groupeOrdreGaucheaDroite } from '@/helpers/partis.js';

export { groupes, getLogoUrl };

const toSlug = text =>
    text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

export const getPhotoUrl = depute => depute?.id ? `/elus/${depute.id}.jpg` : null;

// Store réactif : shallowRef sur la Map pour que les computed Vue se mettent à jour
const _map = shallowRef(new Map());

export const deputesMap = _map;

// Charge les députés depuis l'API et peuple la Map (appelé au démarrage)
export const initDeputes = async () => {
    const res = await fetch('/api/deputes');
    const brut = await res.json();

    const tries = [...brut].sort((a, b) => {
        const ordreA = groupeOrdreGaucheaDroite[a.groupe_abrev] ?? 99;
        const ordreB = groupeOrdreGaucheaDroite[b.groupe_abrev] ?? 99;
        return ordreA - ordreB;
    });

    const newMap = new Map();
    tries.forEach((d, index) => {
        const seatId = index + 1;
        newMap.set(seatId, {
            id: d.id,
            legislature: d.legislature,
            civ: d.civ,
            nom: d.nom,
            prenom: d.prenom,
            villeNaissance: d.ville_naissance,
            naissance: d.naissance,
            age: d.age,
            groupe: d.groupe_abrev,
            groupeAbrev: d.groupe_abrev,
            departementNom: d.departement_nom,
            departementCode: d.departement_code,
            circo: d.circo,
            datePriseFonction: d.date_prise_fonction,
            job: d.job,
            mail: d.mail,
            twitter: d.twitter,
            facebook: d.facebook,
            website: d.website,
            nombreMandats: d.nombre_mandats,
            experienceDepute: d.experience_depute,
            scoreParticipation: d.score_participation !== null ? parseFloat(d.score_participation) : null,
            scoreParticipationSpecialite: d.score_participation_specialite !== null ? parseFloat(d.score_participation_specialite) : null,
            scoreLoyaute: d.score_loyaute !== null ? parseFloat(d.score_loyaute) : null,
            scoreMajorite: d.score_majorite !== null ? parseFloat(d.score_majorite) : null,
            dateMaj: d.date_maj,
            seatId,
            slug: toSlug(`${d.prenom} ${d.nom}`),
        });
    });

    _map.value = newMap;
};

export const getDepute = seatId => _map.value.get(seatId) || null;

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

// computed → se recalcule automatiquement quand _map.value change
export const tousLesDeputes = computed(() => [..._map.value.values()]);

export const statsParGroupe = computed(() =>
    Object.keys(groupeOrdreGaucheaDroite).map(abrev => {
        const deputes = [..._map.value.values()].filter(d => d.groupe === abrev);
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
    }).filter(Boolean)
);

export { normaliserScore, scoreToCouleur };

export default deputesMap;
