import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { sessionReady, signOutStarted } from '@/features/auth';
import { routeTree } from '@/app/routeTree.gen';

describe('защита маршрутов', () => {
  it('неавторизованный пользователь редиректится на /login', async () => {
    // Дожидаемся инициализации мокающей сессии, затем гасим ее: guard обязан увидеть пустую сессию
    await sessionReady;
    signOutStarted();

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });
});
