/**
 * Converts xsi:nil XML-to-JSON artifacts to null.
 * e.g. { "@xsi:nil": "true" } → null
 */
export function val (v) {
    if (v == null) return null;
    if (typeof v === 'object' && v['@xsi:nil'] === 'true') return null;
    return v;
}

/**
 * Extracts the valElec of an address by typeLibelle from the raw adresses array.
 */
export function getAdresse (adresses, typeLibelle) {
    const list = Array.isArray(adresses) ? adresses : [adresses].filter(Boolean);
    const found = list.find(a => a.typeLibelle === typeLibelle);
    return found ? (val(found.valElec) ?? null) : null;
}

/**
 * Parses a raw acteur JSON object into a flat acteur record.
 */
export function parseActeur (raw) {
    const a = raw.acteur;
    const ident = a.etatCivil.ident;
    const nais = a.etatCivil.infoNaissance ?? {};
    const adresses = a.adresses?.adresse
        ? (Array.isArray(a.adresses.adresse) ? a.adresses.adresse : [a.adresses.adresse])
        : [];

    return {
        id: a.uid['#text'],
        civ: val(ident.civ),
        nom: val(ident.nom),
        prenom: val(ident.prenom),
        alpha: val(ident.alpha),
        trigramme: val(ident.trigramme),
        naissance: val(nais.dateNais) ?? null,
        villeNaissance: val(nais.villeNais) ?? null,
        depNaissance: val(nais.depNais) ?? null,
        paysNaissance: val(nais.paysNais) ?? null,
        dateDeces: val(a.etatCivil.dateDeces) ?? null,
        profession: val(a.profession?.libelleCourant) ?? null,
        uriHatvp: val(a.uri_hatvp) ?? null,
        mail: getAdresse(adresses, 'Mèl'),
        twitter: getAdresse(adresses, 'Twitter'),
        facebook: getAdresse(adresses, 'Facebook'),
        instagram: getAdresse(adresses, 'Instagram'),
        linkedin: getAdresse(adresses, 'Linkedin'),
        siteInternet: getAdresse(adresses, 'Site internet'),
    };
}

/**
 * Extracts MINISTERE + GOUVERNEMENT mandats from a raw acteur JSON object.
 */
export function parseMandatsGouvernement (raw) {
    const a = raw.acteur;
    const acteurId = a.uid['#text'];
    let mandats = a.mandats?.mandat ?? [];
    if (!Array.isArray(mandats)) mandats = [mandats];

    return mandats
        .filter(m => m.typeOrgane === 'MINISTERE' || m.typeOrgane === 'GOUVERNEMENT')
        .map(m => ({
            id: m.uid,
            acteurId,
            typeOrgane: m.typeOrgane,
            organeRef: m.organes?.organeRef ?? null,
            qualite: val(m.infosQualite?.libQualite) ?? null,
            legislature: val(m.legislature) != null ? parseInt(m.legislature) : null,
            dateDebut: val(m.dateDebut) ?? null,
            dateFin: val(m.dateFin) ?? null,
            preseance: val(m.preseance) != null ? parseInt(m.preseance) : null,
        }));
}

/**
 * Extracts SENAT mandats from a raw acteur JSON object.
 */
export function parseMandatsSenat (raw) {
    const a = raw.acteur;
    const acteurId = a.uid['#text'];
    let mandats = a.mandats?.mandat ?? [];
    if (!Array.isArray(mandats)) mandats = [mandats];

    return mandats
        .filter(m => m.typeOrgane === 'SENAT')
        .map(m => ({
            id: m.uid,
            acteurId,
            organeRef: m.organes?.organeRef ?? null,
            numDepartement: val(m.election?.lieu?.numDepartement) ?? null,
            dateDebut: val(m.dateDebut) ?? null,
            dateFin: val(m.dateFin) ?? null,
            premiereElection: val(m.mandature?.premiereElection) === '1' ? true
                : val(m.mandature?.premiereElection) === '0' ? false
                    : null,
        }));
}
