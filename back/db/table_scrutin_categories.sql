CREATE TABLE IF NOT EXISTS scrutin_categories (
    id          SERIAL          PRIMARY KEY,
    nom         VARCHAR(100)    NOT NULL UNIQUE,
    couleur     VARCHAR(7)      NOT NULL
);

CREATE TABLE IF NOT EXISTS scrutin_sous_categories (
    id              SERIAL          PRIMARY KEY,
    nom             VARCHAR(100)    NOT NULL,
    categorie_id    INTEGER         NOT NULL REFERENCES scrutin_categories(id) ON DELETE CASCADE,
    UNIQUE(nom, categorie_id)
);

ALTER TABLE scrutins ADD COLUMN IF NOT EXISTS scrutin_categorie_id INTEGER REFERENCES scrutin_categories(id);
ALTER TABLE scrutins ADD COLUMN IF NOT EXISTS scrutin_sous_categorie_id INTEGER REFERENCES scrutin_sous_categories(id);
