import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    // Tests hit the in-process oRPC mock instead of the real api
    env: { VITE_USE_MOCKS: '1' },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/app/main.tsx',
        'src/app/routeTree.gen.ts',
        'src/**/index.ts',
        'src/**/*.d.ts',
        'src/shared/mocks/**',
        'src/shared/ui/assets/**',
        'src/shared/styles/**',
      ],
      thresholds: { statements: 65, branches: 55, functions: 55, lines: 65 },
    },
  },
});
