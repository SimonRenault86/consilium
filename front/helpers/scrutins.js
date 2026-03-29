// Les scrutins sont chargés à la demande via l'API back-end (/api/scrutins)
// pour éviter de bundler des centaines de Mo de JSON dans le build Vite.

export const fetchScrutins = async ({ from, to, q, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    params.set('limit', String(limit));
    const res = await fetch(`/api/scrutins?${params}`);
    if (!res.ok) throw new Error('Erreur chargement des scrutins');
    return res.json();
};
