CREATE TABLE IF NOT EXISTS seed_logs (
    id                      SERIAL          PRIMARY KEY,
    categorie               VARCHAR(100)    NOT NULL,
    executed_at             TIMESTAMP       DEFAULT NOW()
);
