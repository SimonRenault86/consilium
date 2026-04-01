export const fetchQagCategories = async () => {
    const res = await fetch('/api/qags/categories');
    if (!res.ok) throw new Error('Erreur chargement des catégories QaG');
    return res.json();
};

export const fetchSessions = async () => {
    const res = await fetch('/api/qags/sessions');
    if (!res.ok) throw new Error('Erreur chargement des sessions QaG');
    return res.json();
};

export const fetchQags = async (date) => {
    const res = await fetch(`/api/qags?date=${encodeURIComponent(date)}`);
    if (!res.ok) throw new Error('Erreur chargement des questions');
    return res.json();
};

export const fetchLastUpdate = async () => {
    const res = await fetch('/api/qags/last-update');
    if (!res.ok) throw new Error('Erreur chargement de la dernière mise à jour');
    const { lastUpdate } = await res.json();
    return lastUpdate ? new Date(lastUpdate) : null;
};

const mois = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const moisLong = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const formatDate = (dateStr, long = false) => {
    if (!dateStr) return '';
    const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
    return long
        ? `${d} ${moisLong[m - 1]} ${y}`
        : `${d} ${mois[m - 1]} ${y}`;
};
