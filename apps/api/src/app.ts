import cors from '@fastify/cors';
import { RPCHandler } from '@orpc/server/fastify';
import Fastify, { type FastifyInstance } from 'fastify';

import { appRouter, type Context } from './router.js';

export interface AppOptions {
  context: Context;
  corsOrigin?: string | string[];
  logger?: boolean;
}

/** Сборка Fastify-приложения: RPC-эндпоинт oRPC, healthcheck и CORS */
export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });

  await app.register(cors, { origin: options.corsOrigin ?? true, credentials: true });

  const handler = new RPCHandler(appRouter);

  app.route({
    method: ['GET', 'POST'],
    url: '/rpc/*',
    async handler(request, reply) {
      const result = await handler.handle(request, reply, {
        context: options.context,
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
