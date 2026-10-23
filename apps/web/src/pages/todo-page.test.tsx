import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TodoPage } from './todo-page';

/** Свежий QueryClient на каждый тест, чтобы кэш не протекал между тестами */
function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <TodoPage />
    </QueryClientProvider>,
  );
}

describe('TodoPage', () => {
  it('показывает задачи и счетчики статусов', async () => {
    renderPage();

    expect(await screen.findByText('Call mom')).toBeInTheDocument();
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('4 more to do, 0 done')).toBeInTheDocument();
  });

  it('не отправляет пустой заголовок и показывает ошибку из контракта', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Call mom');

    await user.click(screen.getByRole('button', { name: /Add Todo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Title is required');
  });

  it('клик по задаче переключает done и пересчитывает счетчики статусов', async () => {
    const user = userEvent.setup();
    renderPage();
    const title = await screen.findByText('Buy groceries');

    await user.click(title);

    // счетчики считаются по кэшу Query: проверяем состояние текстом, а не классами и разметкой строки
    await waitFor(() => expect(screen.getByText('3 more to do, 1 done')).toBeInTheDocument());
  });
});
