import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import 'dotenv/config';
import { pool } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Running migration against the database...');
  await pool.query(sql);
  console.log('Done. Tables "contacts" and "quotes" are ready.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
