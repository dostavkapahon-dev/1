import pg from 'pg';
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !process.env.DATABASE_URL) throw new Error('Usage: npm run admin:grant -- registered-owner@example.com (DATABASE_URL required)');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const result = await pool.query(`UPDATE "User" SET role='admin' WHERE lower(email)=$1 RETURNING id`, [email]);
  if (!result.rowCount) throw new Error('Register the owner account on the site first. No user was changed.');
  console.log('Administrator role granted to the registered account.');
} finally { await pool.end(); }
