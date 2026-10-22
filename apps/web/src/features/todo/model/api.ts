import {
  todoSchema,
  todoListSchema,
  type CreateTodoInput,
  type Todo,
  type UpdateTodoInput,
} from '@bt/shared';

const BASE_URL = '/api/todos';

/** Загрузка списка: ответ непроверяемой границы проходит через zod */
export async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw new Error(`Не удалось загрузить задачи: HTTP ${response.status}`);
  }
  return todoListSchema.parse(await response.json());
}

/** Создание задачи: id назначает сервер */
export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Не удалось создать задачу: HTTP ${response.status}`);
  }
  return todoSchema.parse(await response.json());
}

/** Точечное обновление полей задачи */
export async function updateTodo(id: string, patch: UpdateTodoInput): Promise<Todo> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw new Error(`Не удалось обновить задачу: HTTP ${response.status}`);
  }
  return todoSchema.parse(await response.json());
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Не удалось удалить задачу: HTTP ${response.status}`);
  }
}
