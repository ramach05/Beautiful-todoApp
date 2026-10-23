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
  it('показывает задачи, загруженные с сервера', async () => {
    renderPage();
    expect(await screen.findByText('Call mom')).toBeInTheDocument();
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  it('добавляет новую задачу через форму', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Call mom');

    await user.type(screen.getByLabelText('New todo title'), 'Buy coffee');
    await user.click(screen.getByRole('button', { name: /Add Todo/i }));

    expect(await screen.findByText('Buy coffee')).toBeInTheDocument();
  });

  it('не отправляет пустой заголовок и показывает ошибку валидации', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Call mom');

    await user.click(screen.getByRole('button', { name: /Add Todo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Title is required');
  });

  it('переключает done по клику на заголовок', async () => {
    const user = userEvent.setup();
    renderPage();
    const title = await screen.findByText('Buy groceries');

    await user.click(title);

    await waitFor(() => expect(title).toHaveClass('line-through'));
  });

  it('фильтрует список поиском', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Call mom');

    await user.type(screen.getByLabelText('Search todos'), 'mom');

    await waitFor(() => expect(screen.queryByText('Do homework')).not.toBeInTheDocument());
    expect(screen.getByText('Call mom')).toBeInTheDocument();
  });

  it('фильтр Done скрывает незавершенные задачи', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Call mom');

    await user.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() =>
      expect(screen.getByText('No todos — add your first one')).toBeInTheDocument(),
    );
  });

  it('удаляет задачу кнопкой удаления', async () => {
    const user = userEvent.setup();
    renderPage();
    const title = await screen.findByText('Do homework');

    await user.click(title.parentElement!.querySelector("button[title='Delete']")!);

    await waitFor(() => expect(title).not.toBeInTheDocument());
  });
});
