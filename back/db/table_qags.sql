CREATE TABLE IF NOT EXISTS qags (
    uid                 VARCHAR(30)     PRIMARY KEY,
    numero              INTEGER         NOT NULL,
    legislature         INTEGER,
    date_seance         DATE,
    rubrique            TEXT,
    sujet               TEXT,
    acteur_ref          VARCHAR(20),
    mandat_ref          VARCHAR(20),
    groupe_ref          VARCHAR(20),
    groupe_abrev        VARCHAR(20),
    groupe_developpe    TEXT,
    min_ref             VARCHAR(20),
    min_abrege          TEXT,
    min_developpe       TEXT,
    texte_reponse       TEXT,
    code_cloture        VARCHAR(20),
    created_at          TIMESTAMP       DEFAULT NOW()
);

ALTER TABLE qags ADD COLUMN IF NOT EXISTS qag_categorie_id INTEGER REFERENCES scrutin_categories(id);
ALTER TABLE qags ADD COLUMN IF NOT EXISTS qag_sous_categorie_id INTEGER REFERENCES scrutin_sous_categories(id);

CREATE INDEX IF NOT EXISTS idx_qags_date_seance ON qags (date_seance);
CREATE INDEX IF NOT EXISTS idx_qags_acteur_ref  ON qags (acteur_ref);
CREATE INDEX IF NOT EXISTS idx_qags_groupe_abrev ON qags (groupe_abrev);
