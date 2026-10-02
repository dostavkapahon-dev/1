import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query('SELECT pg_advisory_lock(20461002)');
  await client.query('CREATE TABLE IF NOT EXISTS app_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
  const dir = fileURLToPath(new URL('../db/migrations/', import.meta.url));
  for (const name of (await readdir(dir)).filter(x => x.endsWith('.sql')).sort()) {
    if ((await client.query('SELECT 1 FROM app_migrations WHERE name=$1', [name])).rowCount) continue;
    // Do not silently overwrite a database previously managed by Prisma.
    if (name === '001_initial.sql') {
      const existing = await client.query(`SELECT to_regclass('public."User"') AS existing`);
      if (existing.rows[0].existing) throw new Error('Existing legacy tables detected. Back up and reconcile migration history before continuing.');
    }
    await client.query('BEGIN');
    try {
      await client.query(await readFile(`${dir}/${name}`, 'utf8'));
      await client.query('INSERT INTO app_migrations(name) VALUES($1)', [name]);
      await client.query('COMMIT');
      console.log(`Applied ${name}`);
    } catch (e) { await client.query('ROLLBACK'); throw e; }
  }
  console.log('Database is up to date.');
} finally {
  await client.query('SELECT pg_advisory_unlock(20461002)');
  client.release(); await pool.end();
}
