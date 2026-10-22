import cors from '@fastify/cors';
import { fromNodeHeaders } from 'better-auth/node';
import { RPCHandler } from '@orpc/server/fastify';
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';

import type { Auth } from './auth.js';
import { appRouter, type Context } from './router.js';
import type { SessionResolver, TodosRepository } from './repo.js';

export interface AppOptions {
  todos: TodosRepository;
  session: SessionResolver;
  /** Без auth маршруты /api/auth/* не подключаются (тесты с фейковой сессией) */
  auth?: Auth;
  corsOrigin?: string | string[];
  logger?: boolean;
}

/** Сборка Fastify-приложения: RPC-эндпоинт oRPC, auth better-auth, healthcheck и CORS */
export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    // x-request-id от клиента (FE) связывает логи фронта и бэка
    genReqId: (request) => {
      const incoming = request.headers['x-request-id'];
      return typeof incoming === 'string' && incoming !== '' ? incoming : randomUUID();
    },
  });

  // id попадает в ответ: клиент может его залогировать при разборе сбоя
  app.addHook('onSend', (request, reply, payload, done) => {
    void reply.header('x-request-id', request.id);
    done(null, payload);
  });

  await app.register(cors, { origin: options.corsOrigin ?? true, credentials: true });

  if (options.auth) {
    await app.register(
      async (scope) => {
        // Встроенные JSON/text парсеры наследуются в scope, поэтому сначала снимаем их
        scope.removeAllContentTypeParsers();
        // Буферizeем raw-тело как есть: better-auth получит оригинальные байты в Web Request
        scope.addContentTypeParser('*', { parseAs: 'buffer' }, (_request, body, done) => {
          done(null, body);
        });
        scope.route({
          method: ['GET', 'POST'],
          url: '/*',
          async handler(request, reply) {
            const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
            const init: RequestInit = {
              method: request.method,
              headers: fromNodeHeaders(request.headers),
            };
            if (request.method !== 'GET' && request.method !== 'HEAD') {
              init.body = (request.body as Buffer | undefined) ?? null;
            }
            const response = await options.auth!.handler(new Request(url, init));
            reply.status(response.status);
            for (const [key, value] of response.headers.entries()) {
              void reply.header(key, value);
            }
            const setCookies = response.headers.getSetCookie();
            if (setCookies.length > 0) {
              void reply.header('set-cookie', setCookies);
            }
            const body = Buffer.from(await response.arrayBuffer());
            return reply.send(body.length > 0 ? body : undefined);
          },
        });
      },
      { prefix: '/api/auth' },
    );
  }

  const handler = new RPCHandler(appRouter);

  app.route({
    method: ['GET', 'POST'],
    url: '/rpc/*',
    async handler(request, reply) {
      const context: Context = {
        todos: options.todos,
        session: options.session,
        headers: fromNodeHeaders(request.headers),
      };
      const result = await handler.handle(request, reply, {
        context,
        prefix: '/rpc',
      });
      if (!result.matched) {
        return reply.callNotFound();
      }
    },
  });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
