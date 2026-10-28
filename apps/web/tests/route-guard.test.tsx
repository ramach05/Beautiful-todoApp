import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { sessionReady, signOutStarted } from '@/features/auth';
import { routeTree } from '@/app/routeTree.gen';

describe('route guard', () => {
  it('redirects an anonymous user to /login', async () => {
    // Wait for the mocking session to initialize, then clear it: the guard must see an empty session
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
