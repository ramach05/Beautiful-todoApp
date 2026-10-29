import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // the env schema requires DATABASE_URL at import; the tests themselves use in-process PGlite
    env: { DATABASE_URL: 'postgres://test:test@localhost:5433/test' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/index.ts',
        'src/testing.ts',
        'src/db/seed.ts',
        'src/**/*.d.ts',
      ],
      thresholds: { statements: 80, branches: 60, functions: 75, lines: 80 },
    },
  },
});
