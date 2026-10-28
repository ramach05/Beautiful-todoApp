import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // env-схема требует DATABASE_URL при импорте; сами тесты используют in-process PGlite
    env: { DATABASE_URL: 'postgres://test:test@localhost:5433/test' },
  },
});
