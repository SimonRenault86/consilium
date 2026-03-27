// Groupes politiques de l'Assemblée nationale (abréviations officielles de la XVIIe législature)
export const groupes = {
    RN:       { nom: 'Rassemblement National',                              couleur: '#0d3b66', couleur2: '#c8102e', logo: '/partis/rn.png' },
    EPR:      { nom: 'Ensemble pour la République',                          couleur: '#ffcc00', couleur2: '#003189', logo: '/partis/epr.png' },
    'LFI-NFP': { nom: 'La France insoumise - Nouveau Front Populaire',       couleur: '#cc2443', couleur2: '#f0504e', logo: '/partis/lfi-nfp.png' },
    DR:       { nom: 'Droite Républicaine',                                  couleur: '#0066cc', couleur2: '#ffffff', logo: '/partis/dr.png' },
    SOC:      { nom: 'Socialistes et apparentés',                            couleur: '#e4032e', couleur2: '#f7a1b0', logo: '/partis/soc.png' },
    DEM:      { nom: 'Les Démocrates',                                       couleur: '#ff9900', couleur2: '#005bac', logo: '/partis/dem.png' },
    HOR:      { nom: 'Horizons & Indépendants',                             couleur: '#0099cc', couleur2: '#00d2ff', logo: '/partis/hor.png' },
    ECOS:     { nom: 'Écologiste et Social',                                couleur: '#00c000', couleur2: '#ffdd00', logo: '/partis/ecos.png' },
    GDR:      { nom: 'Gauche Démocrate et Républicaine',                    couleur: '#dd0000', couleur2: '#8b0000', logo: '/partis/gdr.png' },
    LIOT:     { nom: 'Libertés, Indépendants, Outre-mer et Territoires',    couleur: '#5ba4cf', couleur2: '#f4a300', logo: '/partis/liot.png' },
    UDDPLR:   { nom: 'Union des droites pour la République',                  couleur: '#1a2d5a', couleur2: '#c8102e', logo: '/partis/uddplr.png' },
    NI:       { nom: 'Non inscrit',                                         couleur: '#aaaaaa', couleur2: '#666666', logo: null }
};

// Retourne l'URL du logo d'un groupe — null si absent
export const getLogoUrl = groupe => groupes[groupe]?.logo || null;
