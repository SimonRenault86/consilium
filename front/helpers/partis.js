// Groupes politiques de l'Assemblée nationale (abréviations officielles de la XVIIe législature)
export const groupes = {
    RN:       { nom: 'Rassemblement National', couleur: '#0d3b66', couleur2: '#c8102e', logo: '/partis/rn.png' },
    EPR:      { nom: 'Ensemble pour la République', couleur: '#ffcc00', couleur2: '#003189', logo: '/partis/epr.png' },
    LFI:       { nom: 'La France insoumise', couleur: '#cc2443', couleur2: '#f0504e', logo: '/partis/lfi-nfp.png' },
    DR:       { nom: 'Droite Républicaine', couleur: '#0066cc', couleur2: '#ffffff', logo: '/partis/dr.png' },
    SOC:      { nom: 'Socialistes et apparentés', couleur: '#e4032e', couleur2: '#f7a1b0', logo: '/partis/soc.jpeg' },
    DEM:      { nom: 'Les Démocrates', couleur: '#ff9900', couleur2: '#005bac', logo: '/partis/dem.jpeg' },
    HOR:      { nom: 'Horizons & Indépendants', couleur: '#0099cc', couleur2: '#00d2ff', logo: '/partis/hor.jpg' },
    ECOS:     { nom: 'Écologiste et Social', couleur: '#00c000', couleur2: '#ffdd00', logo: '/partis/ecos.webp' },
    GDR:      { nom: 'Gauche Démocrate et Républicaine', couleur: '#dd0000', couleur2: '#8b0000', logo: '/partis/gdr.png' },
    LIOT:     { nom: 'Libertés, Indépendants, Outre-mer et Territoires', couleur: '#5ba4cf', couleur2: '#f4a300', logo: '/partis/liot.png' },
    UDDPLR:   { nom: 'Union des droites pour la République', couleur: '#1a2d5a', couleur2: '#c8102e', logo: '/partis/uddplr.png' },
    NI:       { nom: 'Non inscrit', couleur: '#aaaaaa', couleur2: '#666666', logo: null }
};

// Ordre politique gauche → droite (XVIIe législature)
export const groupeOrdreGaucheaDroite = {
    LFI:       1,
    GDR:       3,
    ECOS:      2,
    SOC:       4,
    DEM:       5,
    HOR:       6,
    EPR:       7,
    DR:        8,
    LIOT:      9,
    UDDPLR:   10,
    RN:       11,
    NI:       12,
};

// Retourne l'URL du logo d'un groupe — null si absent
export const getLogoUrl = groupe => groupes[groupe]?.logo || null;

// Charge les partis depuis l'API et met à jour les objets en place
// Les données statiques ci-dessus servent de fallback si l'API est indisponible
export const initPartis = async () => {
    const res = await fetch('/api/partis');
    const partis = await res.json();

    for (const parti of partis) {
        groupes[parti.abrev] = {
            nom: parti.nom,
            couleur: parti.couleur,
            couleur2: parti.couleur2,
            logo: parti.logo,
        };
        groupeOrdreGaucheaDroite[parti.abrev] = parti.ordre;
    }
};
