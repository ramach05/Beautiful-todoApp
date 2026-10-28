import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@bt/shared';
import { DEMO_USER, InMemoryTodosRepository } from '@bt/api/testing';

import { useDeleteTodo, useReorderTodos, useTodos, useUpdateTodo } from './queries';

/** Транспорт подменяем, хранилище то же, что у web-мока: проверяем поведение кэша Query */
const apiMock = vi.hoisted(() => ({
  todos: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), reorder: vi.fn() },
}));

vi.mock('@/shared/api', () => ({ api: apiMock }));

const repo = new InMemoryTodosRepository();

/** Ответ сервера резолвим вручную: так видно кэш между оптимистичным патчем и приходом ответа */
function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: Error) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = (reason: Error) => rej(reason);
  });
  return { promise, resolve, reject };
}

/** Клиент пересоздается под каждый рендер: ссылка нужна тестам, чтобы подменять инвалидацию */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

let client: QueryClient = createQueryClient();

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Список загружен в кэш вместе с хуками мутаций поверх него */
async function renderTodoHooks() {
  client = createQueryClient();
  const utils = renderHook(
    () => ({
      list: useTodos(),
      update: useUpdateTodo(),
      remove: useDeleteTodo(),
      reorder: useReorderTodos(),
    }),
    { wrapper },
  );
  await waitFor(() => expect(utils.result.current.list.data).toBeDefined());
  return utils;
}

async function todoByTitle(title: string): Promise<Todo> {
  const found = (await repo.list(DEMO_USER.id)).find((todo) => todo.title === title);
  if (!found) {
    throw new Error(`no todo titled ${title} in the mock`);
  }
  return found;
}

const ids = (todos: Todo[] | undefined) => todos?.map((todo) => todo.id);

beforeEach(() => {
  repo.reset();
  vi.clearAllMocks();
  apiMock.todos.list.mockImplementation(() => repo.list(DEMO_USER.id));
  apiMock.todos.create.mockImplementation((input: CreateTodoInput) =>
    repo.create(input, DEMO_USER.id),
  );
  apiMock.todos.update.mockImplementation(
    async ({ id, patch }: { id: string; patch: UpdateTodoInput }) => {
      const updated = await repo.update(id, patch, DEMO_USER.id);
      if (!updated) {
        throw new Error('todo not found');
      }
      return updated;
    },
  );
  apiMock.todos.remove.mockImplementation(async (id: string) => {
    if (!(await repo.remove(id, DEMO_USER.id))) {
      throw new Error('todo not found');
    }
  });
  apiMock.todos.reorder.mockImplementation((input: { ids: string[] }) =>
    repo.reorder(input.ids, DEMO_USER.id),
  );
});

describe('todo mutations over the Query cache', () => {
  it('update patches the cache before the server responds', async () => {
    const { result } = await renderTodoHooks();
    const target = await todoByTitle('Call mom');
    const pending = deferred<Todo>();
    // инвалидацию гасим: кэш меняется только оптимистичным патчем
    vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
    apiMock.todos.update.mockImplementation(() => pending.promise);

    result.current.update.mutate({ id: target.id, patch: { title: 'Переименованная' } });
    await waitFor(() =>
      expect(result.current.list.data?.find((todo) => todo.id === target.id)?.title).toBe(
        'Переименованная',
      ),
    );
  });

  it('update rolls the cache back on error', async () => {
    const { result } = await renderTodoHooks();
    const target = await todoByTitle('Call mom');
    const pending = deferred<Todo>();
    // вернуть кэш в исходное состояние после сбоя может только onError-откат
    vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
    apiMock.todos.update.mockImplementation(() => pending.promise);

    result.current.update.mutate({ id: target.id, patch: { title: 'Переименованная' } });
    await waitFor(() =>
      expect(result.current.list.data?.find((todo) => todo.id === target.id)?.title).toBe(
        'Переименованная',
      ),
    );

    pending.reject(new Error('server unavailable'));
    await waitFor(() => expect(result.current.update.isError).toBe(true));
    await waitFor(() =>
      expect(result.current.list.data?.find((todo) => todo.id === target.id)?.title).toBe(
        'Call mom',
      ),
    );
  });

  it('remove drops the todo and restores it on error', async () => {
    const { result } = await renderTodoHooks();
    const target = await todoByTitle('Call mom');
    const remaining = (await repo.list(DEMO_USER.id))
      .filter((todo) => todo.id !== target.id)
      .map((todo) => todo.id);
    const pending = deferred<undefined>();
    // вернуть удаленную задачу в кэш может только onError-откат
    vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
    apiMock.todos.remove.mockImplementation(() => pending.promise);

    result.current.remove.mutate(target.id);
    await waitFor(() => expect(ids(result.current.list.data)).toEqual(remaining));

    pending.reject(new Error('server unavailable'));
    await waitFor(() => expect(result.current.remove.isError).toBe(true));
    await waitFor(() => expect(ids(result.current.list.data)).toContain(target.id));
  });

  it('reorder applies the new order optimistically', async () => {
    const { result } = await renderTodoHooks();
    const reversed = (ids(result.current.list.data) ?? []).reverse();
    const pending = deferred<Todo[]>();
    apiMock.todos.reorder.mockImplementation(() => pending.promise);

    result.current.reorder.mutate(reversed);
    await waitFor(() => expect(ids(result.current.list.data)).toEqual(reversed));
  });
});
