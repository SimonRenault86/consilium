import dns from 'dns';
import pg from 'pg';
import 'dotenv/config';

// Forcer la résolution IPv4 — Heroku ne supporte pas IPv6
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

pool.on('error', err => {
    console.error('Erreur inattendue sur le pool PostgreSQL :', err);
    process.exit(-1);
});

export default pool;
