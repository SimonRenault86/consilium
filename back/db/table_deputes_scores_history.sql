CREATE TABLE IF NOT EXISTS deputes_scores_history (
    id                              SERIAL          PRIMARY KEY,
    id_depute                       VARCHAR(20)     NOT NULL REFERENCES deputes(id) ON DELETE CASCADE,
    date_maj                        DATE            NOT NULL,
    score_participation             DECIMAL(6, 4),
    score_participation_specialite  DECIMAL(6, 4),
    score_loyaute                   DECIMAL(6, 4),
    score_majorite                  DECIMAL(6, 4),
    recorded_at                     TIMESTAMP       DEFAULT NOW(),
    UNIQUE (id_depute, date_maj)
);

CREATE INDEX IF NOT EXISTS idx_scores_history_depute ON deputes_scores_history(id_depute);
CREATE INDEX IF NOT EXISTS idx_scores_history_date ON deputes_scores_history(date_maj);
