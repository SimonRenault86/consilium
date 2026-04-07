CREATE TABLE IF NOT EXISTS deputes_commissions (
    id          SERIAL          PRIMARY KEY,
    id_depute   VARCHAR(20)     NOT NULL REFERENCES deputes(id) ON DELETE CASCADE,
    nom         VARCHAR(400)    NOT NULL,
    role        VARCHAR(200)    DEFAULT 'Membre',
    created_at  TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deputes_commissions_depute ON deputes_commissions(id_depute);
