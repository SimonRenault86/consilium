CREATE TABLE IF NOT EXISTS deputes_amendements (
    id_amendement   VARCHAR(60)     NOT NULL REFERENCES amendements(uid) ON DELETE CASCADE,
    id_depute       VARCHAR(20)     NOT NULL REFERENCES deputes(id) ON DELETE CASCADE,
    role            VARCHAR(20)     NOT NULL CHECK (role IN ('auteur', 'cosignataire')),
    PRIMARY KEY (id_amendement, id_depute)
);
