CREATE TABLE IF NOT EXISTS votes (
    uid                 VARCHAR(30)     PRIMARY KEY,
    numero              INTEGER         NOT NULL,
    legislature         INTEGER,
    date_scrutin        DATE,
    titre               TEXT,
    sort                VARCHAR(20),
    demandeur           TEXT,
    type_vote           VARCHAR(100),
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
