CREATE TABLE IF NOT EXISTS deputes (
    id                              VARCHAR(20)     PRIMARY KEY REFERENCES acteurs(id),
    legislature                     INTEGER         NOT NULL,
    groupe                          VARCHAR(200),
    groupe_abrev                    VARCHAR(20),
    departement_nom                 VARCHAR(100),
    departement_code                VARCHAR(10),
    circo                           INTEGER,
    date_prise_fonction             DATE,
    job                             VARCHAR(200),
    nombre_mandats                  INTEGER,
    experience_depute               VARCHAR(50),
    date_maj                        DATE,
    created_at                      TIMESTAMP       DEFAULT NOW(),
    updated_at                      TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deputes_groupe ON deputes(groupe_abrev);
CREATE INDEX IF NOT EXISTS idx_deputes_departement ON deputes(departement_code);

-- Migration : suppression des colonnes de scores (déplacées dans deputes_scores_history)
ALTER TABLE deputes DROP COLUMN IF EXISTS score_participation;
ALTER TABLE deputes DROP COLUMN IF EXISTS score_participation_specialite;
ALTER TABLE deputes DROP COLUMN IF EXISTS score_loyaute;
ALTER TABLE deputes DROP COLUMN IF EXISTS score_majorite;
