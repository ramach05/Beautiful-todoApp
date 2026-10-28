import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { StatsPage } from './stats-page';

/** Fresh QueryClient per test; data comes from the in-process oRPC mock (VITE_USE_MOCKS=1) */
function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <StatsPage />
    </QueryClientProvider>,
  );
}

describe('StatsPage', () => {
  it('shows aggregates and the oldest incomplete todo', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Statistics' })).toBeInTheDocument();

    // Mock todos: 4 total, 4 active, 0 completed, 0 important
    expect(screen.getByText('Total').parentElement).toHaveTextContent('4');
    expect(screen.getByText('Active').parentElement).toHaveTextContent('4');
    expect(screen.getByText('Completed').parentElement).toHaveTextContent('0');
    expect(screen.getByText('Important').parentElement).toHaveTextContent('0');

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });
});
