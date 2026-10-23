/**
 * Полный сброс dev-БД: удаляет схемы public и drizzle, затем пересоздает public.
 * Использование: pnpm --filter @bt/api db:reset
 */
import { Pool } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Не задан DATABASE_URL: скопируйте apps/api/.env.example в apps/api/.env');
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
try {
  // Сносит все таблицы и книгу миграций drizzle, чтобы db:migrate и db:seed прошли с нуля
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('CREATE SCHEMA public');
  await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
  console.log('Схемы public и drizzle сброшены');
} finally {
  await pool.end();
}
