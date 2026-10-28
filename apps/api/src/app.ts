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

/** Fallback auth rate limit when max is not passed; matches the AUTH_RATE_LIMIT_MAX default in the env schema */
const DEFAULT_AUTH_RATE_LIMIT_MAX = 20;

export interface AppOptions {
  todos: TodosRepository;
  session: SessionResolver;
  /** Without auth the /api/auth/* routes are not mounted (tests with a fake session) */
  auth?: Auth;
  corsOrigin?: string | string[];
  logger?: boolean;
  /** auth POST requests per IP per minute: protects against password guessing */
  authRateLimitMax?: number;
  /** HSTS only behind HTTPS: browsers ignore it over plain http in dev anyway */
  hsts?: boolean;
  /** Comma-separated proxy addresses/CIDRs: request.ip is taken from XFF only for peers from this list */
  trustProxy?: string;
  /** Dev mode: any localhost/127.0.0.1 ports are added to the corsOrigin list (Vite moves to a free port) */
  devLocalhostAnyPort?: boolean;
}

/** Local origin on any port: in dev the web server port may shift from 5173 */
const DEV_LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** Dev CORS: explicit CORS_ORIGIN whitelist plus any localhost ports; external origins are rejected */
function devLocalhostCors(corsOrigins: string | string[] | true): OriginFunction {
  return (origin, callback) => {
    if (corsOrigins === true) return callback(null, true);
    // Without an Origin header (curl, same-origin) there is nothing to mirror
    if (origin === undefined) return callback(null, false);
    if (DEV_LOCALHOST_ORIGIN.test(origin)) return callback(null, origin);
    const listed = Array.isArray(corsOrigins)
      ? corsOrigins.includes(origin)
      : corsOrigins === origin;
    callback(null, listed ? origin : false);
  };
}

/** Builds the Fastify app: oRPC RPC endpoint, better-auth auth, healthcheck and CORS */
export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: options.trustProxy ?? false,
    // x-request-id from the client (FE) links frontend and backend logs
    genReqId: (request) => {
      const incoming = request.headers['x-request-id'];
      return typeof incoming === 'string' && incoming !== '' ? incoming : randomUUID();
    },
  });

  // the id goes into the response: the client can log it when debugging a failure
  app.addHook('onSend', (request, reply, payload, done) => {
    void reply.header('x-request-id', request.id);
    done(null, payload);
  });

  // CSP off: JSON API + future Swagger UI; frameguard/nosniff/referrer-policy stay at helmet defaults
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
        // Built-in JSON/text parsers are inherited into the scope, so remove them first
        scope.removeAllContentTypeParsers();
        // Buffer the raw body as-is: better-auth gets the original bytes in the Web Request
        scope.addContentTypeParser('*', { parseAs: 'buffer' }, (_request, body, done) => {
          done(null, body);
        });
        // Limit only on routes with config.rateLimit so GET get-session doesn't spend the guessing bucket
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
          // Fastify itself returns 429 before entering better-auth: JSON body, the response status is not overwritten
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
