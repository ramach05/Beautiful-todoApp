/**
 * Full dev DB reset: drops the public and drizzle schemas, then recreates public.
 * Usage: pnpm --filter @bt/api db:reset
 */
import { Pool } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set: copy apps/api/.env.example to apps/api/.env');
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
try {
  // Drops all tables and the drizzle migrations log so db:migrate and db:seed run from scratch
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('CREATE SCHEMA public');
  await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
  console.log('public and drizzle schemas reset');
} finally {
  await pool.end();
}
