import { envSchema } from '@/env.js';

export const env = envSchema.parse(process.env);
