// Les scrutins sont chargés à la demande via l'API back-end (/api/scrutins)
// pour éviter de bundler des centaines de Mo de JSON dans le build Vite.

export const fetchScrutins = async ({ from, to, q, limit = 10, groupes, categories } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    if (groupes?.length) params.set('groupes', groupes.join(','));
    if (categories?.length) params.set('categories', categories.join(','));
    params.set('limit', String(limit));
    const res = await fetch(`/api/scrutins?${params}`);
    if (!res.ok) throw new Error('Erreur chargement des scrutins');
    return res.json();
};

export const fetchLastUpdate = async () => {
    const res = await fetch('/api/scrutins/last-update');
    if (!res.ok) throw new Error('Erreur chargement de la dernière mise à jour');
    const { lastUpdate } = await res.json();
    return lastUpdate ? new Date(lastUpdate) : null;
};
