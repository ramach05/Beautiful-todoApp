import { ORPCError, createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { FastifyInstance } from 'fastify';
import { fileURLToPath } from 'node:url';

import type { AppContractClient } from '@bt/shared';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';

import { buildApp } from '@/app.js';
import { betterAuthResolver, buildAuth } from '@/auth.js';
import { DEFAULT_TODO_TITLES } from '@/db/default-todos.js';
import * as schema from '@/db/schema.js';
import { todos } from '@/db/schema.js';
import { PostgresTodosRepository } from '@/db/todos-repo.js';

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
async function signUp(email: string, clearDefaults = true): Promise<string> {
  const response = await fetch(`${httpUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: email, email, password: 'password-123' }),
  });
  if (!response.ok) {
    throw new Error(`sign-up failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { user: { id: string } };
  // Хук создания пользователя выдает стартовые задачи: сценариям нужен детерминированный старт
  if (clearDefaults) {
    await db.delete(todos).where(eq(todos.userId, body.user.id));
  }
  const setCookie = response.headers.getSetCookie()[0];
  if (!setCookie) {
    throw new Error('no set-cookie in the sign-up response');
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
    throw new Error('server returned no address after listen');
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

// Тесты мутабельных пакетов держим плоскими (без describe): per-test фильтр Stryker с vitest 5
// не матчит вложенные тесты, и мутанты остаются живыми даже при наличии покрытия.

it('health returns ok', async () => {
  const response = await fetch(`${httpUrl}/health`);
  expect(response.ok).toBe(true);
  expect(await response.json()).toEqual({ status: 'ok' });
});

it('procedures require a session', async () => {
  const error = await createTestClient()
    .todos.list()
    .then(() => null)
    .catch((cause: unknown) => cause);

  expect(error).toBeInstanceOf(ORPCError);
  if (error instanceof ORPCError) {
    expect(error.code).toBe('UNAUTHORIZED');
  }
});

it('a new user gets starter todos', async () => {
  const api = createTestClient(await signUp('starter@test.local', false));

  const titles = (await api.todos.list()).map((todo) => todo.title);
  expect(titles).toEqual(DEFAULT_TODO_TITLES);
});

it('todo CRUD through the oRPC client', async () => {
  const api = createTestClient(await signUp('cruser@test.local'));

  const created = await api.todos.create({ title: 'Купить кофе' });
  expect(created).toMatchObject({ title: 'Купить кофе', important: false, done: false });

  expect(await api.todos.list()).toEqual([created]);

  const updated = await api.todos.update({ id: created.id, patch: { done: true } });
  expect(updated.done).toBe(true);

  await api.todos.remove(created.id);
  expect(await api.todos.list()).toEqual([]);
});

it('list returns todos in position order', async () => {
  const api = createTestClient(await signUp('order@test.local'));
  const first = await api.todos.create({ title: 'Первая' });
  const second = await api.todos.create({ title: 'Вторая' });
  const third = await api.todos.create({ title: 'Третья' });

  // position растет при создании: порядок списка совпадает с порядком создания
  expect((await api.todos.list()).map((todo) => todo.id)).toEqual([first.id, second.id, third.id]);
});

it('reorder stores the new order', async () => {
  const api = createTestClient(await signUp('reorder@test.local'));
  const first = await api.todos.create({ title: 'A' });
  const second = await api.todos.create({ title: 'B' });
  const third = await api.todos.create({ title: 'C' });

  const reordered = await api.todos.reorder({ ids: [third.id, first.id, second.id] });
  expect(reordered.map((todo) => todo.id)).toEqual([third.id, first.id, second.id]);
  expect((await api.todos.list()).map((todo) => todo.id)).toEqual([third.id, first.id, second.id]);

  const added = await api.todos.create({ title: 'D' });
  expect((await api.todos.list()).map((todo) => todo.id)).toEqual([
    third.id,
    first.id,
    second.id,
    added.id,
  ]);
});

it('users cannot see or change foreign todos', async () => {
  const owner = createTestClient(await signUp('owner@test.local'));
  const intruder = createTestClient(await signUp('intruder@test.local'));

  const created = await owner.todos.create({ title: 'Личная задача' });

  expect(await intruder.todos.list()).toEqual([]);
  // чужой id в reorder ничего не переносит: ответ пуст, как и список intruder
  expect(await intruder.todos.reorder({ ids: [created.id] })).toEqual([]);

  const error = await intruder.todos
    .update({ id: created.id, patch: { done: true } })
    .then(() => null)
    .catch((cause: unknown) => cause);
  expect(error).toBeInstanceOf(ORPCError);
  if (error instanceof ORPCError) {
    expect(error.code).toBe('NOT_FOUND');
  }
});

it('missing todo update and remove return NOT_FOUND', async () => {
  const api = createTestClient(await signUp('nfuser@test.local'));
  const missingId = crypto.randomUUID();

  const updateError = await api.todos
    .update({ id: missingId, patch: { done: true } })
    .then(() => null)
    .catch((cause: unknown) => cause);
  expect(updateError).toBeInstanceOf(ORPCError);
  if (updateError instanceof ORPCError) {
    expect(updateError.code).toBe('NOT_FOUND');
  }

  const removeError = await api.todos
    .remove(missingId)
    .then(() => null)
    .catch((cause: unknown) => cause);
  expect(removeError).toBeInstanceOf(ORPCError);
  if (removeError instanceof ORPCError) {
    expect(removeError.code).toBe('NOT_FOUND');
  }
});

it('an empty title is rejected by the contract', async () => {
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
