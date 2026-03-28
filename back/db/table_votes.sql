CREATE TABLE IF NOT EXISTS votes (
    uid                 VARCHAR(30)     PRIMARY KEY,
    numero              INTEGER         NOT NULL,
    legislature         INTEGER,
    date_scrutin        DATE,
    titre               TEXT,
    sort                VARCHAR(20),
    demandeur           TEXT,
    code_type_vote      VARCHAR(20)     REFERENCES type_votes(code),
    type_majorite       VARCHAR(200),
    nb_votants          INTEGER,
    suffrages_exprimes  INTEGER,
    nb_suffrage_requis  INTEGER,
    nb_pour             INTEGER,
    nb_contre           INTEGER,
    nb_abstentions      INTEGER,
    nb_non_votants      INTEGER,
    created_at          TIMESTAMP       DEFAULT NOW()
);

ALTER TABLE votes DROP COLUMN IF EXISTS type_vote;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS code_type_vote VARCHAR(20) REFERENCES type_votes(code);