import { ORPCError, createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { FastifyInstance } from 'fastify';
import { fileURLToPath } from 'node:url';

import type { AppContractClient } from '@bt/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';
import { betterAuthResolver, buildAuth } from './auth.js';
import * as schema from './db/schema.js';
import { todos } from './db/schema.js';
import { PostgresTodosRepository } from './db/todos-repo.js';

const pglite = new PGlite();
const db = drizzle(pglite, { schema });

let app: FastifyInstance;
let httpUrl: string;

/** Клиент oRPC, приклеивающий сессионную cookie better-auth к каждому запросу */
function createTestClient(cookie?: string): AppContractClient {
  const link = new RPCLink({
    url: `${httpUrl}/rpc`,
    fetch: cookie
      ? async (request: Request) => {
          request.headers.set('cookie', cookie);
          return fetch(request);
        }
      : undefined,
  });
  return createORPCClient(link);
}

/** Регистрация через auth-эндпоинт: возвращает cookie сессии из ответа */
async function signUp(email: string): Promise<string> {
  const response = await fetch(`${httpUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: email, email, password: 'password-123' }),
  });
  if (!response.ok) {
    throw new Error(`Регистрация не удалась: ${response.status} ${await response.text()}`);
  }
  const setCookie = response.headers.getSetCookie()[0];
  if (!setCookie) {
    throw new Error('Нет set-cookie в ответе регистрации');
  }
  return setCookie.split(';')[0] ?? '';
}

beforeAll(async () => {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  });
  const auth = buildAuth(db);
  app = await buildApp({
    todos: new PostgresTodosRepository(db),
    session: betterAuthResolver(auth),
    auth,
  });
  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address();
  if (typeof address === 'string' || address === null) {
    throw new Error('Сервер не вернул адрес после listen');
  }
  httpUrl = `http://127.0.0.1:${address.port}`;
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

  it('без сессии процедуры отдают UNAUTHORIZED', async () => {
    const error = await createTestClient()
      .todos.list()
      .then(() => null)
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ORPCError);
    if (error instanceof ORPCError) {
      expect(error.code).toBe('UNAUTHORIZED');
    }
  });

  it('CRUD-сценарий через oRPC-клиент с сессией', async () => {
    const api = createTestClient(await signUp('cruser@test.local'));

    const created = await api.todos.create({ title: 'Купить кофе' });
    expect(created).toMatchObject({ title: 'Купить кофе', important: false, done: false });

    expect(await api.todos.list()).toEqual([created]);

    const updated = await api.todos.update({ id: created.id, patch: { done: true } });
    expect(updated.done).toBe(true);

    await api.todos.remove(created.id);
    expect(await api.todos.list()).toEqual([]);
  });

  it('задачи другого пользователя не видны и не доступны для изменения', async () => {
    const owner = createTestClient(await signUp('owner@test.local'));
    const intruder = createTestClient(await signUp('intruder@test.local'));

    const created = await owner.todos.create({ title: 'Личная задача' });

    expect(await intruder.todos.list()).toEqual([]);

    const error = await intruder.todos
      .update({ id: created.id, patch: { done: true } })
      .then(() => null)
      .catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(ORPCError);
    if (error instanceof ORPCError) {
      expect(error.code).toBe('NOT_FOUND');
    }
  });

  it('update несуществующей задачи - NOT_FOUND', async () => {
    const api = createTestClient(await signUp('nfuser@test.local'));
    const error = await api.todos
      .update({ id: crypto.randomUUID(), patch: { done: true } })
      .then(() => null)
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ORPCError);
    if (error instanceof ORPCError) {
      expect(error.code).toBe('NOT_FOUND');
    }
  });

  it('пустой заголовок отклоняется валидацией контракта', async () => {
    const api = createTestClient(await signUp('valuser@test.local'));
    const error = await api.todos
      .create({ title: '   ' })
      .then(() => null)
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ORPCError);
    if (error instanceof ORPCError) {
      expect(error.code).toBe('BAD_REQUEST');
    }
  });
});
