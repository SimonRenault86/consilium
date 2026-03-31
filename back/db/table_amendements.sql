CREATE TABLE IF NOT EXISTS amendements (
    uid                     VARCHAR(60)     PRIMARY KEY,
    legislature             INTEGER,
    numero_long             VARCHAR(50),
    numero_ordre_depot      INTEGER,
    texte_legislatif_ref    VARCHAR(60),
    auteur_ref              VARCHAR(20),
    groupe_politique_ref    VARCHAR(20),
    article_titre           TEXT,
    article_designation     VARCHAR(100),
    dispositif              TEXT,
    expose_sommaire         TEXT,
    date_depot              DATE,
    date_publication        DATE,
    sort                    VARCHAR(30),
    etat                    VARCHAR(50),
    sous_etat               VARCHAR(50),
    created_at              TIMESTAMP       DEFAULT NOW()
);
ALTER TABLE amendements ADD COLUMN IF NOT EXISTS amendement_categorie_id INTEGER REFERENCES scrutin_categories(id);
ALTER TABLE amendements ADD COLUMN IF NOT EXISTS amendement_sous_categorie_id INTEGER REFERENCES scrutin_sous_categories(id);