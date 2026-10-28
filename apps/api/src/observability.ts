import { fastifyIntegration, init, setupFastifyErrorHandler } from '@sentry/node';
import type { FastifyInstance } from 'fastify';

import { env } from '@/config.js';

/** Sentry включается только при заданном SENTRY_DSN: dev/test не шлют ошибки в облако */
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

/** Обработчик ошибок Fastify в Sentry; no-op без DSN */
export function attachSentry(app: FastifyInstance): void {
  if (!env.SENTRY_DSN) {
    return;
  }
  setupFastifyErrorHandler(app);
}
