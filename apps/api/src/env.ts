import { z } from 'zod';

/** Environment variables go through zod validation at process startup */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    // auth endpoint POST requests per IP per minute: the default is safe for tests, prod lowers it via env
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),
    // Comma-separated proxy addresses/CIDRs: XFF is honored only when the immediate peer is from there
    TRUST_PROXY: z.string().min(1).optional(),
    // Optional in dev/test (a dev secret is used), required in production
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_URL: z.url().default('http://localhost:3001'),
    SENTRY_DSN: z.url().optional(),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.BETTER_AUTH_SECRET !== undefined, {
    message: 'BETTER_AUTH_SECRET is required in production',
    path: ['BETTER_AUTH_SECRET'],
  });

export type Env = z.infer<typeof envSchema>;

/** Secret for dev/test: not production-grade, but production is blocked by the refine above */
export const DEV_AUTH_SECRET = 'dev-only-insecure-secret-0123456789abcdef';
