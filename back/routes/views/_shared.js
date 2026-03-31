export const toSlug = text =>
    text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

// Sérialise un objet en JSON-LD sûr pour injection dans du HTML
export const safeJsonLd = obj => JSON.stringify(obj).replace(/</g, '\\u003C');

const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const formatDate = dateStr => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) {
        const d = dateStr.getDate();
        const m = dateStr.getMonth();
        const y = dateStr.getFullYear();
        return `${d} ${mois[m]} ${y}`;
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${mois[m - 1]} ${y}`;
};
