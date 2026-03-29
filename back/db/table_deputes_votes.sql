CREATE TABLE IF NOT EXISTS deputes_votes (
    id_vote     VARCHAR(30)     NOT NULL REFERENCES scrutins(uid) ON DELETE CASCADE,
    id_depute   VARCHAR(20)     NOT NULL REFERENCES deputes(id) ON DELETE CASCADE,
    position    VARCHAR(20)     NOT NULL CHECK (position IN ('pour', 'contre', 'abstention')),
    PRIMARY KEY (id_vote, id_depute)
);

CREATE INDEX IF NOT EXISTS idx_deputes_votes_id_depute ON deputes_votes(id_depute);
CREATE INDEX IF NOT EXISTS idx_deputes_votes_id_vote   ON deputes_votes(id_vote);
