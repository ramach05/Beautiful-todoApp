import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // env-схема требует DATABASE_URL при импорте; сами тесты используют in-process PGlite
    env: { DATABASE_URL: 'postgres://test:test@localhost:5433/test' },
  },
});
