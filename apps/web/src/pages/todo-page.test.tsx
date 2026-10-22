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
    expect(await screen.findByText('Позвонить маме')).toBeInTheDocument();
    expect(screen.getByText('Сходить в магазин')).toBeInTheDocument();
  });

  it('добавляет новую задачу через форму', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Позвонить маме');

    await user.type(screen.getByLabelText('Заголовок новой задачи'), 'Купить кофе');
    await user.click(screen.getByRole('button', { name: /Add Todo/i }));

    expect(await screen.findByText('Купить кофе')).toBeInTheDocument();
  });

  it('не отправляет пустой заголовок и показывает ошибку валидации', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Позвонить маме');

    await user.click(screen.getByRole('button', { name: /Add Todo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Заголовок обязателен');
  });

  it('переключает done по клику на заголовок', async () => {
    const user = userEvent.setup();
    renderPage();
    const title = await screen.findByText('Сходить в магазин');

    await user.click(title);

    await waitFor(() => expect(title).toHaveClass('line-through'));
  });

  it('фильтрует список поиском', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Позвонить маме');

    await user.type(screen.getByLabelText('Поиск задач'), 'маме');

    await waitFor(() => expect(screen.queryByText('Сделать ДЗ')).not.toBeInTheDocument());
    expect(screen.getByText('Позвонить маме')).toBeInTheDocument();
  });

  it('фильтр Done скрывает незавершенные задачи', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Позвонить маме');

    await user.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() =>
      expect(screen.getByText('Задач нет - добавьте первую')).toBeInTheDocument(),
    );
  });

  it('удаляет задачу кнопкой удаления', async () => {
    const user = userEvent.setup();
    renderPage();
    const title = await screen.findByText('Сделать ДЗ');

    await user.click(title.parentElement!.querySelector("button[title='Удалить']")!);

    await waitFor(() => expect(title).not.toBeInTheDocument());
  });
});
