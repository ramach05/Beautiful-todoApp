import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { routeTree } from '@/app/routeTree.gen';
import { sessionReady, signIn } from '@/features/auth';

/** Mock mode resolves the session not immediately, while the route guard reads it synchronously */
async function prepareSession(): Promise<void> {
  await sessionReady;
  await signIn('demo@local.test', 'password-123');
}

/**
 * Renders the app with a real in-memory router: filter and search are read from the URL,
 * so tests check both the address and the output. Returns the router for address checks.
 */
function mountApp(initialEntry = '/') {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
  const view = render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { router, ...view };
}

/** Mounts the page and waits for a todo from the mock */
async function renderPage(initialEntry = '/') {
  await prepareSession();
  const app = mountApp(initialEntry);
  await screen.findByText('Call mom');
  return app;
}

describe('TodoPage', () => {
  it('renders todos and status counters', async () => {
    const { router } = await renderPage();

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('4 more to do, 0 done')).toBeInTheDocument();
    // Default values are not written to the address
    expect(router.state.location.searchStr).toBe('');
  });

  it('rejects an empty title with a contract error', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByRole('button', { name: /Add Todo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Title is required');
  });

  it('clicking a todo toggles it and updates the counters', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: 'Buy groceries' }));

    // counters are computed from the Query cache: check the state by text, not by classes or row markup
    await waitFor(() => expect(screen.getByText('3 more to do, 1 done')).toBeInTheDocument());
  });

  it('filter writes filter to the URL and limits the list', async () => {
    const user = userEvent.setup();
    const { router } = await renderPage();

    await user.click(screen.getByRole('button', { name: 'Buy groceries' }));
    await waitFor(() => expect(screen.getByText('3 more to do, 1 done')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => expect(router.state.location.search).toEqual({ filter: 'done' }));
    expect(screen.getByRole('button', { name: 'Buy groceries' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Call mom' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(() => expect(router.state.location.search).toEqual({}));
    expect(screen.getByRole('button', { name: 'Call mom' })).toBeInTheDocument();
  });

  it('search writes q to the URL and limits the list', async () => {
    const user = userEvent.setup();
    const { router } = await renderPage();

    await user.type(screen.getByRole('searchbox', { name: 'Search todos' }), 'mom');

    await waitFor(() => expect(router.state.location.search).toEqual({ q: 'mom' }));
    expect(screen.getByRole('button', { name: 'Call mom' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buy groceries' })).not.toBeInTheDocument();
  });

  it('opening ?filter=done shows only done todos', async () => {
    const user = userEvent.setup();
    // Complete a todo via a regular render, then unmount and navigate directly by link
    const first = await renderPage();
    await user.click(screen.getByRole('button', { name: 'Call mom' }));
    await waitFor(() => expect(screen.getByText('3 more to do, 1 done')).toBeInTheDocument());
    first.unmount();

    const second = await renderPage('/?filter=done');

    expect(screen.getByRole('button', { name: 'Call mom' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buy groceries' })).not.toBeInTheDocument();
    expect(second.router.state.location.search).toEqual({ filter: 'done' });
  });
});
