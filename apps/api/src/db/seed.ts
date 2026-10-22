import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { buildAuth } from '../auth.js';
import { env } from '../config.js';
import * as schema from './schema.js';
import { users } from './schema.js';
import { PostgresTodosRepository } from './todos-repo.js';

const SEED_TITLES = ['Сходить в магазин', 'Позвонить маме', 'Сделать ДЗ', 'Погладить рубашку'];
const DEMO_CREDENTIALS = { email: 'demo@local.test', password: 'demo-pass-123', name: 'Demo' };

const pool = new Pool({ connectionString: env.DATABASE_URL });
const db = drizzle(pool, { schema });

const existing = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.email, DEMO_CREDENTIALS.email));

if (existing.length === 0) {
  // Пароль хэширует better-auth: пользователь создается через его API, а не прямой вставкой
  const auth = buildAuth(db);
  const created = await auth.api.signUpEmail({ body: DEMO_CREDENTIALS });
  const repo = new PostgresTodosRepository(db);
  for (const title of SEED_TITLES) {
    await repo.create({ title }, created.user.id);
  }
  console.log(`Создан demo-пользователь и задач: ${SEED_TITLES.length}`);
} else {
  console.log('Demo-пользователь уже существует, сид пропущен');
}

await pool.end();
