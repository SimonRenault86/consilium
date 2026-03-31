import { ref, computed } from 'vue';

const _mandats = ref([]);
export const isMinstresReady = ref(false);

export const initMinstres = async () => {
    const res = await fetch('/api/ministres');
    _mandats.value = await res.json();
    isMinstresReady.value = true;
};

// Couleurs par niveau de rôle
export const COULEURS_GOUVERNEMENT = {
    pm:            '#f59e0b', // Premier ministre
    ministre_etat: '#a855f7', // Ministre d'État
    ministre:      '#3b82f6', // Ministre
};

export const LABELS_GOUVERNEMENT = {
    pm:       'Premier ministre',
    ministre: 'Ministre',
};

const ORDRE_ROLE = { pm: 0, ministre_etat: 1, ministre: 2, delegue: 3 };

export const categorieRole = qualite => {
    if (!qualite) return 'delegue';
    const q = qualite.toLowerCase();
    if (q.includes('premier ministre')) return 'pm';
    if (q.includes("ministre d'état")) return 'ministre_etat';
    if (q.includes('ministre délégué') || q.includes('ministre chargé')) return 'ministre_delegue';
    if (q.includes('ministre') || q.includes('garde des sceaux')) return 'ministre';
    return 'delegue';
};

// Map acteurId → liste de mandats triée du plus récent au plus ancien
export const mandatsParActeur = computed(() => {
    const map = new Map();
    for (const m of _mandats.value) {
        if (!map.has(m.acteurId)) map.set(m.acteurId, []);
        map.get(m.acteurId).push(m);
    }
    return map;
});

// Plus haut rôle jamais occupé par un acteur (null si jamais ministre)
export const getHighestRole = acteurId => {
    const mandats = mandatsParActeur.value.get(acteurId);
    if (!mandats?.length) return null;
    return mandats.reduce((best, m) => {
        const cat = categorieRole(m.qualite);
        return ORDRE_ROLE[cat] < ORDRE_ROLE[best] ? cat : best;
    }, 'delegue');
};

// Mandat le plus récent d'un acteur (pour le tooltip)
export const getDernierMandat = acteurId => {
    const mandats = mandatsParActeur.value.get(acteurId);
    if (!mandats?.length) return null;
    return mandats.reduce((latest, m) => {
        if (!latest) return m;
        return new Date(m.dateDebut) > new Date(latest.dateDebut) ? m : latest;
    }, null);
};

// Gouvernement actuel trié par préséance (hors secrétaires d'État et ministres délégués)
export const gouvernementActuel = computed(() =>
    _mandats.value
        .filter(m => m.isCurrent && !['delegue', 'ministre_delegue'].includes(categorieRole(m.qualite)))
        .sort((a, b) => (a.preseance ?? 999) - (b.preseance ?? 999))
);

export default _mandats;
