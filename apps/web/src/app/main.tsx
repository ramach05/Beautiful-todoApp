import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { sessionReady } from '@/features/auth';

import { routeTree } from './routeTree.gen';
import { initObservability } from './observability';
import { AppProviders } from './providers';
import '@/shared/styles/index.css';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Не найден корневой элемент #root');
}

// Монтируем только после инициализации observability и резолва сессии:
// иначе первый рендер успевает показать неверный экран (вход вместо уже авторизованного)
void Promise.all([initObservability(), sessionReady]).then(() => {
  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
});
