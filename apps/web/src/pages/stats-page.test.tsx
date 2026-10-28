import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { StatsPage } from './stats-page';

/** Свежий QueryClient на тест; данные берутся из in-process oRPC-мока (VITE_USE_MOCKS=1) */
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

    // Моковые задачи: 4 всего, 4 активны, 0 выполнено, 0 важны
    expect(screen.getByText('Total').parentElement).toHaveTextContent('4');
    expect(screen.getByText('Active').parentElement).toHaveTextContent('4');
    expect(screen.getByText('Completed').parentElement).toHaveTextContent('0');
    expect(screen.getByText('Important').parentElement).toHaveTextContent('0');

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });
});
