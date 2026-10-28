import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    // Value from docker-compose; run with DATABASE_URL from the environment for migrate/push
    url: process.env.DATABASE_URL ?? 'postgres://todo:todo@localhost:5433/beautiful_todo',
  },
});
