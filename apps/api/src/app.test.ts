import { fileURLToPath } from 'node:url';

import { ORPCError, createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { AppContractClient } from '@bt/shared';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';
import * as schema from './db/schema.js';
import { todos } from './db/schema.js';
import { PostgresTodosRepository } from './db/todos-repo.js';

function createTestClient(url: string): AppContractClient {
  return createORPCClient(new RPCLink({ url }));
}

const pglite = new PGlite();
const db = drizzle(pglite, { schema });

let app: FastifyInstance;
let httpUrl: string;
let client: ReturnType<typeof createTestClient>;

beforeAll(async () => {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  });
  app = await buildApp({ context: { todos: new PostgresTodosRepository(db) } });
  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address();
  if (typeof address === 'string' || address === null) {
    throw new Error('Сервер не вернул адрес после listen');
  }
  httpUrl = `http://127.0.0.1:${address.port}`;
  client = createTestClient(`${httpUrl}/rpc`);
});

afterAll(async () => {
  await app.close();
  await pglite.close();
});

beforeEach(async () => {
  await db.delete(todos);
});

describe('api', () => {
  it('healthcheck отвечает ok', async () => {
    const response = await fetch(`${httpUrl}/health`);
    expect(response.ok).toBe(true);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('CRUD-сценарий через oRPC-клиент', async () => {
    const created = await client.todos.create({ title: 'Купить кофе' });
    expect(created).toMatchObject({ title: 'Купить кофе', important: false, done: false });

    expect(await client.todos.list()).toEqual([created]);

    const updated = await client.todos.update({ id: created.id, patch: { done: true } });
    expect(updated.done).toBe(true);

    await client.todos.remove(created.id);
    expect(await client.todos.list()).toEqual([]);
  });

  it('update несуществующей задачи - NOT_FOUND', async () => {
    const error = await client.todos
      .update({ id: crypto.randomUUID(), patch: { done: true } })
      .then(() => null)
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ORPCError);
    if (error instanceof ORPCError) {
      expect(error.code).toBe('NOT_FOUND');
    }
  });

  it('пустой заголовок отклоняется валидацией контракта', async () => {
    const error = await client.todos
      .create({ title: '   ' })
      .then(() => null)
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ORPCError);
    if (error instanceof ORPCError) {
      expect(error.code).toBe('BAD_REQUEST');
    }
  });
});
