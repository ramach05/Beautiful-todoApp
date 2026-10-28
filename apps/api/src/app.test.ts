import { ORPCError, createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { PGlite } from '@electric-sql/pglite';
import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { FastifyInstance } from 'fastify';
import { fileURLToPath } from 'node:url';

import type { AppContractClient } from '@bt/shared';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';

import { buildApp } from './app.js';
import { betterAuthResolver, buildAuth } from './auth.js';
import * as schema from './db/schema.js';
import { todos } from './db/schema.js';
import { PostgresTodosRepository } from './db/todos-repo.js';
import { envSchema } from './env.js';
import { InMemoryTodosRepository } from './testing.js';

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
  if (limitedAppPromise) {
    await (await limitedAppPromise).close();
  }
  await pglite.close();
});

beforeEach(async () => {
  await db.delete(todos);
});

// Тесты мутабельных пакетов держим плоскими (без describe): per-test фильтр Stryker с vitest 5
// не матчит вложенные тесты, и мутанты остаются живыми даже при наличии покрытия.

it('healthcheck отвечает ok и отдает x-request-id клиента либо сгенерированный uuid', async () => {
  const withId = await fetch(`${httpUrl}/health`, { headers: { 'x-request-id': 'req-test-1' } });
  expect(withId.ok).toBe(true);
  expect(await withId.json()).toEqual({ status: 'ok' });
  expect(withId.headers.get('x-request-id')).toBe('req-test-1');

  const generated = await fetch(`${httpUrl}/health`);
  expect(generated.headers.get('x-request-id')).toMatch(/[\da-f-]{36}/);
});

it('helmet отдает nosniff и frameguard, без CSP и HSTS вне прода', async () => {
  const headers = (await fetch(`${httpUrl}/health`)).headers;
  expect(headers.get('x-content-type-options')).toBe('nosniff');
  expect(headers.get('x-frame-options')).toBe('SAMEORIGIN');
  expect(headers.get('content-security-policy')).toBeNull();
  expect(headers.get('strict-transport-security')).toBeNull();
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

it('список отдает задачи в порядке position, при равенстве - по created_at и id', async () => {
  const api = createTestClient(await signUp('order@test.local'));
  const first = await api.todos.create({ title: 'Первая' });
  const second = await api.todos.create({ title: 'Вторая B' });
  const third = await api.todos.create({ title: 'Вторая A' });

  // position растет при создании: порядок списка совпадает с порядком создания
  expect((await api.todos.list()).map((todo) => todo.id)).toEqual([first.id, second.id, third.id]);

  // при равных position порядок отдан created_at и id: метки фиксируем обходом API
  await db
    .update(todos)
    .set({ position: 0 })
    .where(inArray(todos.id, [second.id, third.id]));
  await db
    .update(todos)
    .set({ position: 5, createdAt: new Date('2026-01-01T00:00:00Z') })
    .where(eq(todos.id, first.id));
  const same = new Date('2026-02-01T00:00:00Z');
  await db
    .update(todos)
    .set({ createdAt: same })
    .where(inArray(todos.id, [second.id, third.id]));

  const ids = (await api.todos.list()).map((todo) => todo.id);
  expect(ids).toEqual([...[second.id, third.id].sort(), first.id]);
});

it('reorder задает новый порядок, новая задача добавляется в конец', async () => {
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

it('задачи другого пользователя не видны и не доступны для изменения', async () => {
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

it('update и remove несуществующей задачи - NOT_FOUND', async () => {
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

it('locale хранится в профиле: дефолт en, запись update-user, произвольное значение отклоняется', async () => {
  const cookie = await signUp('locale@test.local');
  const headers = { cookie, 'content-type': 'application/json' };
  // Минимальная форма ответа get-session для проверок теста
  type SessionResponse = { user?: { locale?: string } };

  const getResponse = () => fetch(`${httpUrl}/api/auth/get-session`, { headers });
  const sessionBody = (await (await getResponse()).json()) as SessionResponse;
  expect(sessionBody.user?.locale).toBe('en');

  const updated = await fetch(`${httpUrl}/api/auth/update-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ locale: 'ru' }),
  });
  expect(updated.status).toBe(200);
  const afterUpdate = (await (await getResponse()).json()) as SessionResponse;
  expect(afterUpdate.user?.locale).toBe('ru');

  const rejected = await fetch(`${httpUrl}/api/auth/update-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ locale: 'de' }),
  });
  expect(rejected.status).toBe(400);
});

// Приложение с пониженным лимитом auth POST поднимается лениво: отдельный порт вне основного app
let limitedAppPromise: Promise<FastifyInstance> | undefined;
async function limitedUrl(): Promise<string> {
  limitedAppPromise ??= (async () => {
    const auth = buildAuth(db);
    const limitedApp = await buildApp({
      todos: new PostgresTodosRepository(db),
      session: betterAuthResolver(auth),
      auth,
      // Пониженный лимит: 2 POST на IP за минуту
      authRateLimitMax: 2,
    });
    await limitedApp.listen({ port: 0, host: '127.0.0.1' });
    return limitedApp;
  })();
  const limitedApp = await limitedAppPromise;
  const address = limitedApp.server.address();
  if (typeof address === 'string' || address === null) {
    throw new Error('Сервер не вернул адрес после listen');
  }
  return `http://127.0.0.1:${address.port}`;
}

it('rate limit: сверх лимита POST отвечает 429, а GET сессии и healthcheck не лимитируются', async () => {
  const url = await limitedUrl();
  const signInAttempt = () =>
    fetch(`${url}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'brute@test.local', password: 'wrong-password' }),
    });

  expect((await signInAttempt()).status).toBe(401);
  expect((await signInAttempt()).status).toBe(401);

  const blocked = await signInAttempt();
  expect(blocked.status).toBe(429);
  expect(blocked.headers.get('retry-after')).not.toBeNull();
  expect(await blocked.json()).toMatchObject({ statusCode: 429 });

  // GET get-session не тратит бакет: перечитывание сессии не должно блокировать вход
  expect((await fetch(`${url}/api/auth/get-session`)).status).not.toBe(429);
  expect((await fetch(`${url}/health`)).status).toBe(200);
});

it('env-схема держит дефолт и пропускает пониженное AUTH_RATE_LIMIT_MAX', () => {
  const base = { DATABASE_URL: 'postgres://test:test@localhost:5433/test' };
  expect(envSchema.parse(base).AUTH_RATE_LIMIT_MAX).toBe(20);
  expect(envSchema.parse({ ...base, AUTH_RATE_LIMIT_MAX: '3' }).AUTH_RATE_LIMIT_MAX).toBe(3);
});

it('devLocalhostAnyPort: CORS пропускает любой localhost-порт, внешний origin — нет', async () => {
  const devApp = await buildApp({
    todos: new InMemoryTodosRepository(false),
    session: { resolve: async () => null },
    corsOrigin: ['http://localhost:5173'],
    devLocalhostAnyPort: true,
  });
  await devApp.listen({ port: 0, host: '127.0.0.1' });
  try {
    const address = devApp.server.address();
    if (typeof address === 'string' || address === null) {
      throw new Error('Сервер не вернул адрес после listen');
    }
    const url = `http://127.0.0.1:${address.port}`;

    // Vite не застал 5173 и уехал на 5175: origin обязан получить echo
    const moved = await fetch(`${url}/health`, { headers: { origin: 'http://localhost:5175' } });
    expect(moved.headers.get('access-control-allow-origin')).toBe('http://localhost:5175');

    const listed = await fetch(`${url}/health`, { headers: { origin: 'http://localhost:5173' } });
    expect(listed.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');

    const foreign = await fetch(`${url}/health`, { headers: { origin: 'http://evil.example' } });
    expect(foreign.headers.get('access-control-allow-origin')).toBeNull();
  } finally {
    await devApp.close();
  }
});
