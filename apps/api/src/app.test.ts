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
import { DEMO_USER, InMemoryTodosRepository } from '@/testing.js';

const pglite = new PGlite();
const db = drizzle(pglite, { schema });

let app: FastifyInstance;
let httpUrl: string;

/** oRPC client that attaches the better-auth session cookie to every request */
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

/** Signs up through the auth endpoint: returns the session cookie from the response */
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
  // The user-create hook issues starter todos: scenarios need a deterministic start
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

// Keep mutable-package tests flat (no describe): Stryker's per-test filter with vitest 5
// doesn't match nested tests, so mutants survive even with coverage.

it('health returns ok', async () => {
  const response = await fetch(`${httpUrl}/health`);
  expect(response.ok).toBe(true);
  expect(await response.json()).toEqual({ status: 'ok' });
});

it('readyz passes without a probe and fails when the probe throws', async () => {
  // the main test app is built without a probe: readiness degenerates to liveness
  expect((await fetch(`${httpUrl}/readyz`)).ok).toBe(true);

  const failing = await buildApp({
    todos: new InMemoryTodosRepository(),
    session: { resolve: async () => DEMO_USER },
    readiness: () => Promise.reject(new Error('db down')),
  });
  const response = await failing.inject({ method: 'GET', url: '/readyz' });
  await failing.close();

  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual({ status: 'unavailable' });
});

it('dev cors allows any localhost port and the listed origin, rejects the rest', async () => {
  const dev = await buildApp({
    todos: new InMemoryTodosRepository(),
    session: { resolve: async () => DEMO_USER },
    corsOrigin: 'https://allowed.test',
    devLocalhostAnyPort: true,
  });

  const local = await dev.inject({
    method: 'GET',
    url: '/health',
    headers: { origin: 'http://localhost:5199' },
  });
  expect(local.headers['access-control-allow-origin']).toBe('http://localhost:5199');

  const listed = await dev.inject({
    method: 'GET',
    url: '/health',
    headers: { origin: 'https://allowed.test' },
  });
  expect(listed.headers['access-control-allow-origin']).toBe('https://allowed.test');

  const foreign = await dev.inject({
    method: 'GET',
    url: '/health',
    headers: { origin: 'https://evil.test' },
  });
  expect(foreign.headers['access-control-allow-origin']).toBeUndefined();

  await dev.close();
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

  // position grows on create: list order matches creation order
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
  // a foreign id in reorder moves nothing: the response is empty, just like the intruder's list
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
