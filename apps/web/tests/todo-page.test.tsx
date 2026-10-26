import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { routeTree } from '@/app/routeTree.gen';
import { sessionReady, signIn } from '@/features/auth';

/** Мок-режим резолвит сессию не сразу, а guard роутов читает ее синхронно */
async function prepareSession(): Promise<void> {
  await sessionReady;
  await signIn('demo@local.test', 'password-123');
}

/**
 * Рендер приложения настоящим роутером в памяти: фильтр и поиск читаются из URL,
 * поэтому тесты проверяют и адрес, и выдачу. Возвращает роутер ради проверок адреса.
 * offline=true имитирует отсутствие сети: запрос Query не стартует и остается pending-состояние.
 */
function mountApp(initialEntry = '/', options: { offline?: boolean } = {}) {
  if (options.offline) {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => false });
  }
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

/** Монтирует страницу и ждет задачи из мока */
async function renderPage(initialEntry = '/') {
  await prepareSession();
  const app = mountApp(initialEntry);
  await screen.findByText('Call mom');
  return app;
}

describe('TodoPage', () => {
  it('до прихода задач отдает доступный каркас вместо текста загрузки', async () => {
    await prepareSession();
    // Offline: запрос Query не стартует, поэтому pending-состояние стабильно до самого конца теста
    const app = mountApp('/', { offline: true });
    try {
      const status = await app.findByRole('status');
      expect(status).toHaveAttribute('aria-busy', 'true');
      expect(status).toHaveTextContent('Loading todos');
      expect(screen.queryByText('Call mom')).not.toBeInTheDocument();
    } finally {
      Reflect.deleteProperty(window.navigator, 'onLine');
    }
  });

  it('показывает задачи и счетчики статусов без параметров в URL', async () => {
    const { router } = await renderPage();

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('4 more to do, 0 done')).toBeInTheDocument();
    // Значения по умолчанию в адрес не пишутся
    expect(router.state.location.searchStr).toBe('');
  });

  it('не отправляет пустой заголовок и показывает ошибку из контракта', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByRole('button', { name: /Add Todo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Title is required');
  });

  it('клик по задаче переключает done и пересчитывает счетчики статусов', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: 'Buy groceries' }));

    // счетчики считаются по кэшу Query: проверяем состояние текстом, а не классами и разметкой строки
    await waitFor(() => expect(screen.getByText('3 more to do, 1 done')).toBeInTheDocument());
  });

  it('переключение фильтра кликом пишет filter в URL и срезает список', async () => {
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

  it('поиск пишет q в URL и ограничивает список', async () => {
    const user = userEvent.setup();
    const { router } = await renderPage();

    await user.type(screen.getByRole('searchbox', { name: 'Search todos' }), 'mom');

    await waitFor(() => expect(router.state.location.search).toEqual({ q: 'mom' }));
    expect(screen.getByRole('button', { name: 'Call mom' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buy groceries' })).not.toBeInTheDocument();
  });

  it('прямой заход с ?filter=done показывает только выполненные', async () => {
    const user = userEvent.setup();
    // Выполняем задачу обычным рендером, затем размонтируем и заходим напрямую по ссылке
    const first = await renderPage();
    await user.click(screen.getByRole('button', { name: 'Call mom' }));
    await waitFor(() => expect(screen.getByText('3 more to do, 1 done')).toBeInTheDocument());
    first.unmount();

    const second = await renderPage('/?filter=done');

    expect(screen.getByRole('button', { name: 'Call mom' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buy groceries' })).not.toBeInTheDocument();
    expect(second.router.state.location.search).toEqual({ filter: 'done' });
  });

  it('невалидный filter в URL схлопывается в all', async () => {
    const { router } = await renderPage('/?filter=bogus');

    expect(router.state.location.search).toEqual({});
    expect(screen.getByRole('button', { name: 'Call mom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buy groceries' })).toBeInTheDocument();
  });
});
