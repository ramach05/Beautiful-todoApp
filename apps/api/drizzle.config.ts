import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    // Значение из docker-compose; для migrate/push запускается с DATABASE_URL из окружения
    url: process.env.DATABASE_URL ?? 'postgres://todo:todo@localhost:5433/beautiful_todo',
  },
});
