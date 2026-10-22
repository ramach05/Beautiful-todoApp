import { z } from 'zod';

/** Переменные окружения проходят zod-валидацию на старте процесса */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    // В dev/test допустимо не задавать (используется dev-секрет), в production обязателен
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    BETTER_AUTH_URL: z.url().default('http://localhost:3001'),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.BETTER_AUTH_SECRET !== undefined, {
    message: 'BETTER_AUTH_SECRET обязателен в production',
    path: ['BETTER_AUTH_SECRET'],
  });

export type Env = z.infer<typeof envSchema>;

/** Секрет для dev/test: не продакшено-пригодный, но в production путь закрыт refine-ом выше */
export const DEV_AUTH_SECRET = 'dev-only-insecure-secret-0123456789abcdef';
