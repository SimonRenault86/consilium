// Groupes politiques de l'Assemblée nationale
export const groupes = {
    RN:   { nom: 'Rassemblement National',                              couleur: '#0d3b66', couleur2: '#c8102e', logo: '/partis/rn.png' },
    ENS:  { nom: 'Renaissance',                                         couleur: '#ffcc00', couleur2: '#003189', logo: '/partis/ens.png' },
    LFI:  { nom: 'La France Insoumise',                                 couleur: '#cc2443', couleur2: '#f0504e', logo: '/partis/lfi.png' },
    LR:   { nom: 'Les Républicains',                                    couleur: '#0066cc', couleur2: '#ffffff', logo: '/partis/lr.png' },
    SOC:  { nom: 'Socialistes',                                         couleur: '#e4032e', couleur2: '#f7a1b0', logo: '/partis/soc.png' },
    DEM:  { nom: 'Démocrate',                                           couleur: '#ff9900', couleur2: '#005bac', logo: '/partis/dem.png' },
    HOR:  { nom: 'Horizons',                                            couleur: '#0099cc', couleur2: '#00d2ff', logo: '/partis/hor.png' },
    ECO:  { nom: 'Écologiste',                                          couleur: '#00c000', couleur2: '#ffdd00', logo: '/partis/eco.png' },
    GDR:  { nom: 'Gauche Démocrate et Républicaine',                    couleur: '#dd0000', couleur2: '#8b0000', logo: '/partis/gdr.png' },
    LIOT: { nom: 'Libertés, Indépendants, Outre-mer et Territoires',    couleur: '#5ba4cf', couleur2: '#f4a300', logo: '/partis/liot.png' },
    NI:   { nom: 'Non inscrit',                                         couleur: '#aaaaaa', couleur2: '#666666', logo: null }
};

// Retourne l'URL du logo d'un groupe — null si absent
export const getLogoUrl = groupe => groupes[groupe]?.logo || null;
