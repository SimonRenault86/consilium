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
        { name: 'Députés', description: 'Données sur les députés de la 17e législature' },
        { name: 'Votes', description: 'Scrutins publics de l\'Assemblée Nationale' },
    ],
    paths: {
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
            Erreur: {
                type: 'object',
                properties: {
                    error: { type: 'string', example: 'Format de date invalide' },
                },
            },
        },
    },
};
