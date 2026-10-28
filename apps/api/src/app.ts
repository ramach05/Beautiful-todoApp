import cors from '@fastify/cors';
import type { OriginFunction } from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { fromNodeHeaders } from 'better-auth/node';
import { RPCHandler } from '@orpc/server/fastify';
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance, type RouteHandler } from 'fastify';

import type { Auth } from '@/auth.js';
import { registerDocs } from '@/docs.js';
import { appRouter, type Context } from '@/router.js';
import type { SessionResolver, TodosRepository } from '@/repo.js';

/** Запасное значение лимита auth, когда max не передан; совпадает с дефолтом AUTH_RATE_LIMIT_MAX в env-схеме */
const DEFAULT_AUTH_RATE_LIMIT_MAX = 20;

export interface AppOptions {
  todos: TodosRepository;
  session: SessionResolver;
  /** Без auth маршруты /api/auth/* не подключаются (тесты с фейковой сессией) */
  auth?: Auth;
  corsOrigin?: string | string[];
  logger?: boolean;
  /** POST-запросы к auth на IP за минуту: защита от подбора пароля */
  authRateLimitMax?: number;
  /** HSTS только за HTTPS: на http в dev браузер его все равно игнорирует */
  hsts?: boolean;
  /** Адреса/CIDR прокси списком через запятую: request.ip берется из XFF только для peer из этого списка */
  trustProxy?: string;
  /** Dev-режим: к списку corsOrigin добавляются любые localhost/127.0.0.1 порты (Vite уходит на свободный порт) */
  devLocalhostAnyPort?: boolean;
}

/** Локальный origin на любом порту: в dev порт web-сервера может сдвинуться с 5173 */
const DEV_LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** Dev CORS: явный whitelist CORS_ORIGIN плюс любые localhost-порты; внешний origin отклоняется */
function devLocalhostCors(corsOrigins: string | string[] | true): OriginFunction {
  return (origin, callback) => {
    if (corsOrigins === true) return callback(null, true);
    // Без Origin (curl, same-origin) зеркалить нечего
    if (origin === undefined) return callback(null, false);
    if (DEV_LOCALHOST_ORIGIN.test(origin)) return callback(null, origin);
    const listed = Array.isArray(corsOrigins)
      ? corsOrigins.includes(origin)
      : corsOrigins === origin;
    callback(null, listed ? origin : false);
  };
}

/** Сборка Fastify-приложения: RPC-эндпоинт oRPC, auth better-auth, healthcheck и CORS */
export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: options.trustProxy ?? false,
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

  // CSP off: JSON-API + будущий Swagger UI; frameguard/nosniff/referrer-policy остаются дефолтами helmet
  await app.register(helmet, {
    contentSecurityPolicy: false,
    strictTransportSecurity: options.hsts ?? false,
  });

  const corsOrigins = options.corsOrigin ?? true;
  await app.register(cors, {
    origin: options.devLocalhostAnyPort ? devLocalhostCors(corsOrigins) : corsOrigins,
    credentials: true,
  });

  if (options.auth) {
    await app.register(
      async (scope) => {
        // Встроенные JSON/text парсеры наследуются в scope, поэтому сначала снимаем их
        scope.removeAllContentTypeParsers();
        // Буферizeем raw-тело как есть: better-auth получит оригинальные байты в Web Request
        scope.addContentTypeParser('*', { parseAs: 'buffer' }, (_request, body, done) => {
          done(null, body);
        });
        // Лимит только на маршрутах с config.rateLimit, чтобы GET get-session не тратил бакет подбора
        await scope.register(rateLimit, { global: false });
        const proxy: RouteHandler = async (request, reply) => {
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
        };
        scope.route({ method: 'GET', url: '/*', handler: proxy });
        scope.route({
          method: 'POST',
          url: '/*',
          // 429 отдает сам Fastify до входа в better-auth: тело JSON, статус ответа не перезаписывается
          config: {
            rateLimit: {
              max: options.authRateLimitMax ?? DEFAULT_AUTH_RATE_LIMIT_MAX,
              timeWindow: '1 minute',
            },
          },
          handler: proxy,
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

  await registerDocs(app);

  return app;
}
