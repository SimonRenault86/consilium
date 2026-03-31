import 'dotenv/config';
import pool from '../back/db/dbManager.js';

const client = await pool.connect();
try {
    await client.query('BEGIN');

    // 1. Trouver et supprimer les FK qui référencent deputes
    const fkRes = await client.query(`
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
        JOIN information_schema.table_constraints tc2 ON tc2.constraint_name = rc.unique_constraint_name
        WHERE tc2.table_name = 'deputes' AND tc.constraint_type = 'FOREIGN KEY'
    `);
    console.log('FKs à supprimer :', fkRes.rows);
    for (const row of fkRes.rows) {
        await client.query(`ALTER TABLE ${row.table_name} DROP CONSTRAINT ${row.constraint_name}`);
    }

    // 2. Renommer les index de deputes_tmp
    await client.query('ALTER INDEX IF EXISTS idx_deputes_tmp_groupe RENAME TO idx_deputes_groupe');
    await client.query('ALTER INDEX IF EXISTS idx_deputes_tmp_departement RENAME TO idx_deputes_departement');

    // 3. Renommer les tables
    await client.query('ALTER TABLE deputes RENAME TO deputes_legacy');
    await client.query('ALTER TABLE deputes_tmp RENAME TO deputes');

    // 4. Recréer les FK vers la nouvelle table deputes
    await client.query(`ALTER TABLE deputes_votes ADD CONSTRAINT deputes_votes_id_depute_fkey
        FOREIGN KEY (id_depute) REFERENCES deputes(id) ON DELETE CASCADE`);
    await client.query(`ALTER TABLE deputes_amendements ADD CONSTRAINT deputes_amendements_id_depute_fkey
        FOREIGN KEY (id_depute) REFERENCES deputes(id) ON DELETE CASCADE`);

    await client.query('COMMIT');
    console.log('Migration terminée avec succès.');
} catch (e) {
    await client.query('ROLLBACK');
    console.error('Erreur, rollback effectué :', e.message);
    process.exit(1);
} finally {
    client.release();
    await pool.end();
}
