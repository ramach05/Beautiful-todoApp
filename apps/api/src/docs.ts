import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import scalarApiReference from '@scalar/fastify-api-reference';
import type { FastifyInstance } from 'fastify';

import { appContract } from '@bt/shared';

// better-auth default session cookie name (auth.ts overrides only the attributes)
const SESSION_COOKIE_NAME = 'better-auth.session_token';

/**
 * Public API docs: /openapi.json (OpenAPI 3.1) and /docs (Scalar UI).
 * The spec is generated from the @bt/shared oRPC contract — the same source
 * that types the server and client; no session required, but only our rpc contract.
 */
export async function registerDocs(app: FastifyInstance): Promise<void> {
  const generator = new OpenAPIGenerator({ schemaConverters: [new ZodToJsonSchemaConverter()] });

  // all contract procedures are built on the authed base, so the security scheme is global
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

  // Scalar serves its JS bundle from the package, no CDN is used (matters for the Docker image)
  await app.register(scalarApiReference, {
    routePrefix: '/docs',
    configuration: { url: '/openapi.json' },
  });
}
