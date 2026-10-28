import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { sessionReady } from '@/features/auth';

import { routeTree } from './routeTree.gen';
import { initLocale } from './locale-sync';
import { initObservability } from './observability';
import { AppProviders } from './providers';
import '@/shared/styles/index.css';

const router = createRouter({
  routeTree,
  // View transition only on path change: typing in search (replace) does not trigger it;
  // the option is ignored when the browser lacks startViewTransition support
  defaultViewTransition: { types: ({ pathChanged }) => (pathChanged ? ['bt-route'] : false) },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

// Mount only after observability init and session resolution:
// otherwise the first render manages to show the wrong screen (login for an already authorized user)
void Promise.all([initObservability(), sessionReady]).then(() => {
  initLocale();
  createRoot(rootElement).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
});
