CREATE TABLE IF NOT EXISTS senateurs (
    id                  VARCHAR(20)     PRIMARY KEY,
    acteur_id           VARCHAR(20)     NOT NULL REFERENCES acteurs(id),
    organe_ref          VARCHAR(200),
    num_departement     VARCHAR(10),
    date_debut          DATE,
    date_fin            DATE,
    premiere_election   BOOLEAN,
    created_at          TIMESTAMP       DEFAULT NOW(),
    updated_at          TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_senateurs_acteur ON senateurs(acteur_id);
CREATE INDEX IF NOT EXISTS idx_senateurs_departement ON senateurs(num_departement);
