import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@bt/shared';
import { DEMO_USER, InMemoryTodosRepository } from '@bt/api/testing';

import { todoKeys, useAddTodo, useDeleteTodo, useTodos, useUpdateTodo } from './queries';

/** Транспорт подменяем, хранилище то же, что у web-мока: проверяем поведение кэша Query */
const apiMock = vi.hoisted(() => ({
  todos: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
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
      add: useAddTodo(),
      update: useUpdateTodo(),
      remove: useDeleteTodo(),
    }),
    { wrapper },
  );
  await waitFor(() => expect(utils.result.current.list.data).toBeDefined());
  return utils;
}

async function todoByTitle(title: string): Promise<Todo> {
  const found = (await repo.list(DEMO_USER.id)).find((todo) => todo.title === title);
  if (!found) {
    throw new Error(`В моке нет задачи ${title}`);
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
        throw new Error('Задача не найдена');
      }
      return updated;
    },
  );
  apiMock.todos.remove.mockImplementation(async (id: string) => {
    if (!(await repo.remove(id, DEMO_USER.id))) {
      throw new Error('Задача не найдена');
    }
  });
});

describe('мутации задач поверх кэша Query', () => {
  it('update патчит кэш до ответа сервера и откатывает его при ошибке', async () => {
    const { result } = await renderTodoHooks();
    const target = await todoByTitle('Call mom');
    const pending = deferred<Todo>();
    // инвалидацию гасим: вернуть кэш в исходное состояние после сбоя может только onError-откат
    vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
    apiMock.todos.update.mockImplementation(() => pending.promise);

    result.current.update.mutate({ id: target.id, patch: { title: 'Переименованная' } });
    await waitFor(() =>
      expect(result.current.list.data?.find((todo) => todo.id === target.id)?.title).toBe(
        'Переименованная',
      ),
    );

    pending.reject(new Error('Сервер недоступен'));
    await waitFor(() => expect(result.current.update.isError).toBe(true));
    await waitFor(() =>
      expect(result.current.list.data?.find((todo) => todo.id === target.id)?.title).toBe(
        'Call mom',
      ),
    );
  });

  it('update подтверждает оптимистичные данные ответом сервера и инвалидирует список', async () => {
    const { result } = await renderTodoHooks();
    const target = await todoByTitle('Call mom');
    const invalidated = vi.spyOn(client, 'invalidateQueries');

    result.current.update.mutate({ id: target.id, patch: { done: true } });
    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
    await waitFor(() =>
      expect(result.current.list.data?.find((todo) => todo.id === target.id)?.done).toBe(true),
    );
    expect(invalidated).toHaveBeenCalledWith({ queryKey: todoKeys.all });
  });

  it('remove убирает задачу из кэша до ответа и возвращает ее при ошибке', async () => {
    const { result } = await renderTodoHooks();
    const target = await todoByTitle('Call mom');
    const remaining = (await repo.list(DEMO_USER.id))
      .filter((todo) => todo.id !== target.id)
      .map((todo) => todo.id);
    const pending = deferred<undefined>();
    // инвалидацию гасим: вернуть удаленную задачу в кэш может только onError-откат
    vi.spyOn(client, 'invalidateQueries').mockResolvedValue();
    apiMock.todos.remove.mockImplementation(() => pending.promise);

    result.current.remove.mutate(target.id);
    await waitFor(() => expect(ids(result.current.list.data)).toEqual(remaining));

    pending.reject(new Error('Сервер недоступен'));
    await waitFor(() => expect(result.current.remove.isError).toBe(true));
    await waitFor(() => expect(ids(result.current.list.data)).toContain(target.id));
  });

  it('remove сохраняет удаление после успешного ответа сервера', async () => {
    const { result } = await renderTodoHooks();
    const target = await todoByTitle('Call mom');
    const remaining = (await repo.list(DEMO_USER.id))
      .filter((todo) => todo.id !== target.id)
      .map((todo) => todo.id);

    result.current.remove.mutate(target.id);
    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
    await waitFor(() => expect(ids(result.current.list.data)).toEqual(remaining));
  });

  it('add отправляет заголовок и инвалидирует список, задача приходит с сервера', async () => {
    const { result } = await renderTodoHooks();
    const invalidated = vi.spyOn(client, 'invalidateQueries');

    result.current.add.mutate({ title: 'Новая задача' });
    await waitFor(() => expect(result.current.add.isSuccess).toBe(true));

    expect(apiMock.todos.create).toHaveBeenCalledWith({ title: 'Новая задача' });
    expect(invalidated).toHaveBeenCalledWith({ queryKey: todoKeys.all });
    await waitFor(() =>
      expect(result.current.list.data?.some((todo) => todo.title === 'Новая задача')).toBe(true),
    );
  });
});
