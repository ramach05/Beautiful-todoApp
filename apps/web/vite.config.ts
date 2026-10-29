import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: false,
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      // Split vendors by library: Sentry is lazy-init'd by DSN and must not enter the entry chunk
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id))
            return 'vendor-react';
          if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return 'vendor-tanstack';
          if (/[\\/]node_modules[\\/]@dnd-kit[\\/]/.test(id)) return 'vendor-dnd';
          if (/[\\/]node_modules[\\/](effector|effector-react)[\\/]/.test(id))
            return 'vendor-effector';
          if (/[\\/]node_modules[\\/]@sentry[\\/]/.test(id)) return 'vendor-sentry';
          return undefined;
        },
      },
    },
  },
  server: { port: 5173 },
});
