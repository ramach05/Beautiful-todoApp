import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '../config.js';
import { PostgresTodosRepository } from './todos-repo.js';
import * as schema from './schema.js';

const SEED_TITLES = ['Сходить в магазин', 'Позвонить маме', 'Сделать ДЗ', 'Погладить рубашку'];

const pool = new Pool({ connectionString: env.DATABASE_URL });
const repo = new PostgresTodosRepository(drizzle(pool, { schema }));

if ((await repo.list()).length === 0) {
  for (const title of SEED_TITLES) {
    await repo.create({ title });
  }
  console.log(`Добавлено задач: ${SEED_TITLES.length}`);
} else {
  console.log('Таблица задач не пуста, сид пропущен');
}

await pool.end();
