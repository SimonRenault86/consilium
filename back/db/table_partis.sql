CREATE TABLE IF NOT EXISTS partis (
    abrev                   VARCHAR(20)     PRIMARY KEY,
    nom                     VARCHAR(200)    NOT NULL,
    couleur                 VARCHAR(20),
    couleur2                VARCHAR(20),
    logo                    VARCHAR(200),
    ordre     INTEGER,
    created_at              TIMESTAMP       DEFAULT NOW(),
    updated_at              TIMESTAMP       DEFAULT NOW()
);