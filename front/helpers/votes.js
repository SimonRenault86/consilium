// Charge tous les fichiers de votes bruts et les transforme en données exploitables
const votesBruts = import.meta.glob('@/helpers/brut/votes/*.json', { eager: true });

const extractVotants = decompteNominatif => {
    if (!decompteNominatif) return [];
    const extract = (section, position) => {
        if (!section || !section.votant) return [];
        const votants = Array.isArray(section.votant) ? section.votant : [section.votant];
        return votants.map(v => ({ acteurRef: v.acteurRef, position }));
    };
    return [
        ...extract(decompteNominatif.pours, 'pour'),
        ...extract(decompteNominatif.contres, 'contre'),
        ...extract(decompteNominatif.abstentions, 'abstention'),
    ];
};

const parseVote = raw => {
    const s = raw.scrutin;
    const groupes = s.ventilationVotes?.organe?.groupes?.groupe || [];
    const groupesArr = Array.isArray(groupes) ? groupes : [groupes];

    // Construire la map acteurRef → position (pour/contre/abstention)
    const votantsMap = {};
    for (const g of groupesArr) {
        const dn = g.vote?.decompteNominatif;
        if (!dn) continue;
        for (const v of extractVotants(dn)) {
            votantsMap[v.acteurRef] = v.position;
        }
    }

    return {
        uid: s.uid,
        numero: parseInt(s.numero, 10),
        dateScrutin: s.dateScrutin,
        titre: s.titre,
        sort: s.sort?.code || null,
        sortLibelle: s.sort?.libelle || null,
        demandeur: s.demandeur?.texte || null,
        synthese: {
            votants: parseInt(s.syntheseVote?.nombreVotants || '0', 10),
            pour: parseInt(s.syntheseVote?.decompte?.pour || '0', 10),
            contre: parseInt(s.syntheseVote?.decompte?.contre || '0', 10),
            abstentions: parseInt(s.syntheseVote?.decompte?.abstentions || '0', 10),
        },
        votantsMap,
    };
};

const votes = Object.values(votesBruts)
    .map(m => parseVote(m.default || m))
    .sort((a, b) => {
        // Date décroissante puis numéro décroissant
        const dateComp = b.dateScrutin.localeCompare(a.dateScrutin);
        if (dateComp !== 0) return dateComp;
        return b.numero - a.numero;
    });

export default votes;
