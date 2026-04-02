CREATE TABLE IF NOT EXISTS depute_coherence (
    id_depute   VARCHAR(20)     NOT NULL REFERENCES deputes(id) ON DELETE CASCADE,
    mois        DATE            NOT NULL,
    recap       TEXT,
    resume      TEXT,
    statut      VARCHAR(20),
    coherence   JSONB           NOT NULL DEFAULT '[]',
    computed_at TIMESTAMP       DEFAULT NOW(),
    PRIMARY KEY (id_depute, mois)
);

CREATE INDEX IF NOT EXISTS idx_depute_coherence_mois ON depute_coherence(mois DESC);
