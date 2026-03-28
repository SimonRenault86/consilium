// Les votes sont chargés à la demande via l'API back-end (/api/votes)
// pour éviter de bundler des centaines de Mo de JSON dans le build Vite.

export const fetchVotes = async ({ from, to, q, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    params.set('limit', String(limit));
    const res = await fetch(`/api/votes?${params}`);
    if (!res.ok) throw new Error('Erreur chargement des votes');
    return res.json();
};
