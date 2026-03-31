CREATE TABLE IF NOT EXISTS mandats_gouvernement (
    id              VARCHAR(20)     PRIMARY KEY,
    acteur_id       VARCHAR(20)     NOT NULL REFERENCES acteurs(id),
    type_organe     VARCHAR(50)     NOT NULL,
    organe_ref      VARCHAR(200),
    qualite         VARCHAR(300),
    legislature     INTEGER,
    date_debut      DATE,
    date_fin        DATE,
    preseance       INTEGER,
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mandats_gouvernement_acteur ON mandats_gouvernement(acteur_id);
CREATE INDEX IF NOT EXISTS idx_mandats_gouvernement_type ON mandats_gouvernement(type_organe);
