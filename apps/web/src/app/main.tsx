import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { routeTree } from '../routeTree.gen';
import { AppProviders } from './providers';
import '../styles/index.css';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

/** В dev трафик перехватывает MSW-worker (реальный API появится в PR-5) */
async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import('../mocks/browser');
    await worker.start({ onUnhandledFrame: 'bypass' });
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Не найден корневой элемент #root');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
}

void bootstrap();
