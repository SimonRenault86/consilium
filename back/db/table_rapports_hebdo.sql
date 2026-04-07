CREATE TABLE IF NOT EXISTS rapports_hebdo (
    id              SERIAL          PRIMARY KEY,
    semaine_debut   DATE            NOT NULL,
    semaine_fin     DATE            NOT NULL,
    narratif        TEXT,
    scrutins        JSONB           NOT NULL DEFAULT '[]',
    themes_qags     JSONB           NOT NULL DEFAULT '[]',
    amendements     JSONB           NOT NULL DEFAULT '[]',
    computed_at     TIMESTAMP       DEFAULT NOW(),
    UNIQUE (semaine_debut)
);

CREATE INDEX IF NOT EXISTS idx_rapports_hebdo_semaine ON rapports_hebdo(semaine_debut DESC);
