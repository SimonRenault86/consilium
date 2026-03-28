export default {
    openapi: '3.0.3',
    info: {
        title: 'Consilium API',
        description: 'API publique donnant accès aux données de l\'Assemblée Nationale : députés et scrutins publics.',
        version: '1.0.0',
        contact: {
            url: 'https://data.assemblee-nationale.fr',
        },
    },
    servers: [{ url: '/api', description: 'Serveur principal' }],
    tags: [
        { name: 'Partis', description: 'Groupes politiques de la 17e législature' },
        { name: 'Députés', description: 'Données sur les députés de la 17e législature' },
        { name: 'Votes', description: 'Scrutins publics de l\'Assemblée Nationale' },
    ],
    paths: {
        '/partis': {
            get: {
                tags: ['Partis'],
                summary: 'Liste tous les groupes politiques',
                description: 'Retourne la liste des groupes politiques de la 17e législature, triés de gauche à droite.',
                operationId: 'getPartis',
                responses: {
                    '200': {
                        description: 'Liste des groupes politiques',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Parti' },
                                },
                            },
                        },
                    },
                    '500': { description: 'Erreur serveur' },
                },
            },
        },
        '/partis/{abrev}': {
            get: {
                tags: ['Partis'],
                summary: 'Récupère un groupe politique par son abréviation',
                operationId: 'getPartiByAbrev',
                parameters: [
                    {
                        name: 'abrev',
                        in: 'path',
                        required: true,
                        description: 'Abréviation du groupe (ex: SOC, RN, EPR)',
                        schema: { type: 'string', example: 'SOC' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Groupe politique',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Parti' },
                            },
                        },
                    },
                    '404': {
                        description: 'Parti introuvable',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Erreur' },
                            },
                        },
                    },
                },
            },
        },
        '/deputes': {
            get: {
                tags: ['Députés'],
                summary: 'Liste tous les députés',
                description: 'Retourne la liste complète des députés de la 17e législature, triés par nom.',
                operationId: 'getDeputes',
                responses: {
                    '200': {
                        description: 'Liste des députés',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Depute' },
                                },
                            },
                        },
                    },
                    '500': { description: 'Erreur serveur' },
                },
            },
        },
        '/deputes/{id}': {
            get: {
                tags: ['Députés'],
                summary: 'Détail d\'un député',
                description: 'Retourne toutes les informations d\'un député : identité, mandat, commissions, collaborateurs, scores d\'activité et liens de contact.',
                operationId: 'getDeputeById',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'Identifiant Assemblée Nationale (ex: PA1008)',
                        schema: { type: 'string', example: 'PA1008' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Informations du député',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DeputeDetail' },
                            },
                        },
                    },
                    '404': {
                        description: 'Député introuvable',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Erreur' },
                            },
                        },
                    },
                    '500': { description: 'Erreur serveur' },
                },
            },
        },
        '/deputes/{id}/votes-stats': {
            get: {
                tags: ['Députés'],
                summary: 'Stats de vote d\'un député',
                description: 'Retourne le total des votes du député ainsi que sa répartition (pour / contre / abstentions) et ses 5 derniers scrutins.',
                operationId: 'getDeputeVotesStats',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        description: 'Identifiant Assemblée Nationale du député (ex: PA1008)',
                        schema: { type: 'string', example: 'PA1008' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Statistiques de vote',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/VotesStats' },
                            },
                        },
                    },
                    '404': {
                        description: 'Aucun vote pour ce député',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Erreur' },
                            },
                        },
                    },
                    '500': { description: 'Erreur serveur' },
                },
            },
        },
        '/votes/{uid}': {
            get: {
                tags: ['Votes'],
                summary: 'Détail d\'un scrutin avec les votes nominatifs',
                operationId: 'getVoteByUid',
                parameters: [
                    {
                        name: 'uid',
                        in: 'path',
                        required: true,
                        description: 'Identifiant unique du scrutin (ex: VTANR5L17V78)',
                        schema: { type: 'string', example: 'VTANR5L17V78' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Scrutin avec la map des votants',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Vote' },
                            },
                        },
                    },
                    '404': {
                        description: 'Vote introuvable',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Erreur' },
                            },
                        },
                    },
                },
            },
        },
        '/votes': {
            get: {
                tags: ['Votes'],
                summary: 'Liste les scrutins',
                description: 'Retourne les scrutins publics, triés par numéro décroissant (plus récents en premier). Le paramètre `limit` est plafonné à 200.',
                operationId: 'getVotes',
                parameters: [
                    {
                        name: 'from',
                        in: 'query',
                        description: 'Date de début (incluse)',
                        schema: { type: 'string', format: 'date', example: '2024-01-01' },
                    },
                    {
                        name: 'to',
                        in: 'query',
                        description: 'Date de fin (incluse)',
                        schema: { type: 'string', format: 'date', example: '2024-12-31' },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        description: 'Nombre maximum de résultats (défaut : 10, max : 200)',
                        schema: { type: 'integer', minimum: 1, maximum: 200, default: 10 },
                    },
                    {
                        name: 'q',
                        in: 'query',
                        description: 'Recherche textuelle dans le titre du scrutin',
                        schema: { type: 'string', example: 'budget' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Liste des scrutins',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Vote' },
                                },
                            },
                        },
                    },
                    '400': {
                        description: 'Format de date invalide',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Erreur' },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        schemas: {
            Parti: {
                type: 'object',
                properties: {
                    abrev: { type: 'string', example: 'SOC', description: 'Abréviation officielle du groupe' },
                    nom: { type: 'string', example: 'Socialistes et apparentés' },
                    couleur: { type: 'string', example: '#e4032e', description: 'Couleur principale (hex)' },
                    couleur2: { type: 'string', example: '#f7a1b0', description: 'Couleur secondaire (hex)' },
                    logo: { type: 'string', nullable: true, example: '/partis/soc.jpeg', description: 'Chemin vers le logo' },
                    ordre: { type: 'integer', example: 4, description: 'Position sur l\'échiquier politique (1 = extrême gauche)' },
                },
            },
            Depute: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'PA1008', description: 'Identifiant Assemblée Nationale' },
                    legislature: { type: 'integer', example: 17 },
                    civ: { type: 'string', example: 'M.' },
                    nom: { type: 'string', example: 'David' },
                    prenom: { type: 'string', example: 'Alain' },
                    ville_naissance: { type: 'string', example: 'Libourne' },
                    naissance: { type: 'string', format: 'date', example: '1949-06-02' },
                    age: { type: 'integer', example: 76 },
                    groupe: { type: 'string', example: 'Socialistes et apparentés' },
                    groupe_abrev: { type: 'string', example: 'SOC' },
                    departement_nom: { type: 'string', example: 'Gironde' },
                    departement_code: { type: 'string', example: '33' },
                    circo: { type: 'integer', example: 4, description: 'Numéro de circonscription' },
                    date_prise_fonction: { type: 'string', format: 'date', example: '2024-07-08' },
                    job: { type: 'string', example: 'Ingénieur' },
                    mail: { type: 'string', format: 'email', example: 'Alain.David@assemblee-nationale.fr' },
                    twitter: { type: 'string', nullable: true, example: '@AlainDavid33' },
                    facebook: { type: 'string', nullable: true, example: 'alaindavid33' },
                    website: { type: 'string', nullable: true, example: 'alain-david.com' },
                    nombre_mandats: { type: 'integer', example: 3 },
                    experience_depute: { type: 'string', example: '9 ans' },
                    score_participation: { type: 'number', format: 'float', example: 0.07, description: 'Taux de participation aux votes (0–1)' },
                    score_participation_specialite: { type: 'number', format: 'float', example: 0.0, description: 'Taux de participation dans sa spécialité (0–1)' },
                    score_loyaute: { type: 'number', format: 'float', example: 0.912, description: 'Score de loyauté envers le groupe (0–1)' },
                    score_majorite: { type: 'number', format: 'float', example: 0.0, description: 'Score de vote avec la majorité (0–1)' },
                    date_maj: { type: 'string', format: 'date', example: '2026-03-25' },
                },
            },
            Vote: {
                type: 'object',
                properties: {
                    uid: { type: 'string', example: 'VTANR5L17V78' },
                    numero: { type: 'integer', example: 78 },
                    dateScrutin: { type: 'string', format: 'date', example: '2024-10-24' },
                    titre: { type: 'string', example: "l'amendement n° 3556 de Mme Louwagie après l'article 3 du projet de loi de finances pour 2025." },
                    sort: { type: 'string', example: 'adopté', description: 'Résultat : adopté ou rejeté' },
                    demandeur: { type: 'string', nullable: true, example: 'Président du groupe "Droite Républicaine"' },
                    synthese: {
                        type: 'object',
                        properties: {
                            votants: { type: 'integer', example: 177 },
                            pour: { type: 'integer', example: 110 },
                            contre: { type: 'integer', example: 65 },
                            abstentions: { type: 'integer', example: 2 },
                        },
                    },
                    votantsMap: {
                        type: 'object',
                        description: 'Map acteurRef → position du député lors du vote',
                        additionalProperties: { type: 'string', enum: ['pour', 'contre', 'abstention'] },
                        example: { PA1008: 'pour', PA1592: 'contre', PA2155: 'abstention' },
                    },
                },
            },
            DeputeDetail: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'PA1008' },
                    civ: { type: 'string', example: 'M.' },
                    nom: { type: 'string', example: 'David' },
                    prenom: { type: 'string', example: 'Alain' },
                    age: { type: 'integer', example: 76 },
                    naissance: { type: 'string', format: 'date', example: '1949-06-02' },
                    villeNaissance: { type: 'string', example: 'Libourne' },
                    job: { type: 'string', nullable: true },
                    groupe: { type: 'string', example: 'Socialistes et apparentés' },
                    groupeAbrev: { type: 'string', example: 'SOC' },
                    groupeLogo: { type: 'string', nullable: true },
                    groupeCouleur: { type: 'string', nullable: true },
                    departementNom: { type: 'string', example: 'Gironde' },
                    departementCode: { type: 'string', example: '33' },
                    circo: { type: 'integer', example: 4 },
                    datePriseFonction: { type: 'string', format: 'date', example: '2024-07-08' },
                    nombreMandats: { type: 'integer', example: 3 },
                    experienceDepute: { type: 'string', example: '9 ans' },
                    scoreParticipation: { type: 'number', nullable: true, example: 0.07 },
                    scoreLoyaute: { type: 'number', nullable: true, example: 0.912 },
                    mail: { type: 'string', nullable: true },
                    twitter: { type: 'string', nullable: true },
                    facebook: { type: 'string', nullable: true },
                    website: { type: 'string', nullable: true },
                    hatvpUrl: { type: 'string', nullable: true },
                    mandatPrincipal: {
                        type: 'object',
                        nullable: true,
                        properties: {
                            legislature: { type: 'integer', example: 17 },
                            region: { type: 'string', nullable: true },
                            causeMandat: { type: 'string', nullable: true },
                            placeHemicycle: { type: 'integer', nullable: true },
                            premiereElection: { type: 'boolean' },
                            collaborateurs: { type: 'array', items: { type: 'string' } },
                        },
                    },
                    commissions: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                nom: { type: 'string' },
                                role: { type: 'string', example: 'Membre' },
                            },
                        },
                    },
                },
            },
            Erreur: {
                type: 'object',
                properties: {
                    error: { type: 'string', example: 'Format de date invalide' },
                },
            },
            VotesStats: {
                type: 'object',
                properties: {
                    total: { type: 'integer', example: 312, description: 'Nombre total de scrutins auxquels le député a participé' },
                    pour: { type: 'integer', example: 198 },
                    contre: { type: 'integer', example: 87 },
                    abstentions: { type: 'integer', example: 27 },
                    derniersVotes: {
                        type: 'array',
                        description: '5 scrutins les plus récents',
                        items: {
                            type: 'object',
                            properties: {
                                uid: { type: 'string', example: 'VTANR5L17V312' },
                                numero: { type: 'integer', example: 312 },
                                titre: { type: 'string' },
                                sort: { type: 'string', example: 'adopté' },
                                position: { type: 'string', enum: ['pour', 'contre', 'abstention'] },
                                dateScrutin: { type: 'string', format: 'date', example: '2025-11-14' },
                            },
                        },
                    },
                },
            },
        },
    },
};
