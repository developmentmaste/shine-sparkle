import pg from 'pg';

const { Pool } = pg;

// Prefer a single DATABASE_URL (what most hosted Postgres providers give you).
// Falls back to individual PG* vars for local setups.
const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'shine_sparkle',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    };

export const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  // Catches errors on idle clients so one bad connection doesn't crash the process.
  console.error('Unexpected Postgres pool error:', err.message);
});

// Small helper so routes don't import pg directly.
export async function query(text, params) {
  return pool.query(text, params);
}
