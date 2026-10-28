import { fastifyIntegration, init, setupFastifyErrorHandler } from '@sentry/node';
import type { FastifyInstance } from 'fastify';

import { env } from '@/config.js';

/** Sentry is enabled only when SENTRY_DSN is set: dev/test don't send errors to the cloud */
export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    return;
  }
  init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.2,
    integrations: [fastifyIntegration()],
  });
}

/** Reports Fastify errors to Sentry; no-op without a DSN */
export function attachSentry(app: FastifyInstance): void {
  if (!env.SENTRY_DSN) {
    return;
  }
  setupFastifyErrorHandler(app);
}
