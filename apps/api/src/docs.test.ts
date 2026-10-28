import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { FastifyInstance } from 'fastify';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '@/app.js';
import * as schema from '@/db/schema.js';
import { PostgresTodosRepository } from '@/db/todos-repo.js';

const pglite = new PGlite();
const db = drizzle(pglite, { schema });

let app: FastifyInstance;
let httpUrl: string;

/** Минимальная форма спецификации для проверок теста */
interface Spec {
  openapi: string;
  paths: Record<string, { post?: { responses: Record<string, unknown> } }>;
  components?: { securitySchemes?: Record<string, { type?: string; in?: string; name?: string }> };
  security?: Record<string, unknown>[];
}

beforeAll(async () => {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  });
  // auth не подключаем: docs публичные, а null-резолвер доказывает, что сессия для них не нужна
  app = await buildApp({
    todos: new PostgresTodosRepository(db),
    session: { resolve: async () => null },
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

describe('docs', () => {
  it('GET /openapi.json возвращает валидную спецификацию с путями процедур', async () => {
    const response = await fetch(`${httpUrl}/openapi.json`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const spec = (await response.json()) as Spec;
    expect(spec.openapi).toMatch(/^3\.1/);

    for (const path of [
      '/todos/list',
      '/todos/create',
      '/todos/update',
      '/todos/remove',
      '/todos/reorder',
    ]) {
      const operation = spec.paths[path]?.post;
      expect(operation, `post ${path}`).toBeTruthy();
      // каждая процедура authed: в контракте описан UNAUTHORIZED -> 401
      expect(operation?.responses['401'], `401 on ${path}`).toBeTruthy();
    }

    expect(spec.components?.securitySchemes?.sessionCookie).toMatchObject({
      type: 'apiKey',
      in: 'cookie',
      name: 'better-auth.session_token',
    });
    expect(spec.security).toEqual([{ sessionCookie: [] }]);
  });

  it('GET /docs открывает HTML-интерфейс без сессии', async () => {
    const response = await fetch(`${httpUrl}/docs`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');

    const html = await response.text();
    expect(html.toLowerCase()).toContain('scalar');
    // ассеты UI локальные (из пакета): без CDN страница жива и в Docker-образе
    expect(html).not.toMatch(/https?:\/\/[^"]*cdn/i);
    expect(html).toContain('js/scalar.js');
  });

  it('rpc-процедуры при этом требуют сессию: без cookie 401', async () => {
    const response = await fetch(`${httpUrl}/rpc/todos/list`, { method: 'POST' });
    expect(response.status).toBe(401);
  });
});
