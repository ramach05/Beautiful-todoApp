import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { count, eq } from 'drizzle-orm';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as schema from '@/db/schema.js';
import { todos, users } from '@/db/schema.js';

const pglite = new PGlite();
const db = drizzle(pglite, { schema });

/** Проверка каскадного удаления задач при удалении владельца (FK user_id -> user) */
describe('каскадное удаление задач', () => {
  beforeAll(async () => {
    await migrate(db, {
      migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
    });
  });

  afterAll(async () => {
    await pglite.close();
  });

  it('удаление пользователя удаляет его задачи и не трогает чужие', async () => {
    const ownerId = crypto.randomUUID();
    const otherId = crypto.randomUUID();

    await db.insert(users).values([
      { id: ownerId, name: 'owner', email: 'owner@cascade.local' },
      { id: otherId, name: 'other', email: 'other@cascade.local' },
    ]);
    await db.insert(todos).values([
      { title: 'owner-1', userId: ownerId },
      { title: 'owner-2', userId: ownerId },
      { title: 'other-1', userId: otherId },
    ]);

    await db.delete(users).where(eq(users.id, ownerId));

    const remaining = await db
      .select({ id: todos.id })
      .from(todos)
      .where(eq(todos.userId, ownerId));
    expect(remaining).toHaveLength(0);

    const [others] = await db.select({ n: count() }).from(todos).where(eq(todos.userId, otherId));
    expect(others?.n).toBe(1);
  });
});
