export const fetchAmendements = async ({ from, to, q, sort, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    if (sort) params.set('sort', sort);
    params.set('limit', String(limit));
    const res = await fetch(`/api/amendements?${params}`);
    if (!res.ok) throw new Error('Erreur chargement des amendements');
    return res.json();
};

export const fetchAmendementLastUpdate = async () => {
    const res = await fetch('/api/amendements/last-update');
    if (!res.ok) throw new Error('Erreur chargement de la dernière mise à jour');
    const { lastUpdate } = await res.json();
    return lastUpdate ? new Date(lastUpdate) : null;
};
