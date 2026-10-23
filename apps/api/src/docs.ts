import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import scalarApiReference from '@scalar/fastify-api-reference';
import type { FastifyInstance } from 'fastify';

import { appContract } from '@bt/shared';

// имя сессионной cookie better-auth по умолчанию (в auth.ts переопределены только атрибуты)
const SESSION_COOKIE_NAME = 'better-auth.session_token';

/**
 * Публичная документация API: /openapi.json (OpenAPI 3.1) и /docs (Scalar UI).
 * Спецификация генерируется из oRPC-контракта @bt/shared — тот же источник,
 * что типизирует сервер и клиент; без сессии, но только по нашему rpc-контракту.
 */
export async function registerDocs(app: FastifyInstance): Promise<void> {
  const generator = new OpenAPIGenerator({ schemaConverters: [new ZodToJsonSchemaConverter()] });

  // все процедуры контракта построены на authed-базе, поэтому security scheme глобальная
  const spec = await generator.generate(appContract, {
    info: {
      title: 'Beautiful TODO API',
      version: '0.0.0',
      description:
        'Todo app oRPC contract: procedures are served by POST requests under /rpc, schemas come from the shared zod contracts.',
    },
    servers: [{ url: '/rpc' }],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: SESSION_COOKIE_NAME,
          description:
            'better-auth session cookie; without a valid session every procedure responds 401 UNAUTHORIZED.',
        },
      },
    },
    security: [{ sessionCookie: [] }],
  });

  app.get('/openapi.json', async () => spec);

  // Scalar отдает свой JS-бандл из пакета, CDN не используется (важно для Docker-образа)
  await app.register(scalarApiReference, {
    routePrefix: '/docs',
    configuration: { url: '/openapi.json' },
  });
}
