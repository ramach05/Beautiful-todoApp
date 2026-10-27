import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { sessionReady, signIn } from '@/features/auth';

import { routeTree } from '@/app/routeTree.gen';

describe('навигация в header', () => {
  it('показывает Todo/Stats/Settings и помечает активный маршрут', async () => {
    await sessionReady;
    // В мок-режиме signIn сразу заполняет сессию — guard пропустит на /
    await signIn('demo@local.test', 'password-123');

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    render(
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    const todoLink = await screen.findByRole('link', { name: 'Todo' });
    expect(screen.getByRole('link', { name: 'Stats' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(todoLink).toHaveAttribute('aria-current', 'page');
  });
});
