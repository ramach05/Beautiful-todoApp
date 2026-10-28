import { z } from 'zod';

/**
 * Задача: id и даты формирует сервер (uuid + ISO). createdAt — момент создания,
 * completedAt — момент выполнения либо null, если задача еще не выполнена.
 * Даты опциональны в контракте для обратной совместимости, но api отдает их всегда.
 */
export const todoSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  important: z.boolean(),
  done: z.boolean(),
  createdAt: z.iso.datetime().optional(),
  completedAt: z.iso.datetime().nullable().optional(),
});
export type Todo = z.infer<typeof todoSchema>;

/** Ответ списка задач */
export const todoListSchema = z.array(todoSchema);

/** Вход создания: id и флаги по умолчанию формирует сервер; тексты ошибок переводит UI по коду issues */
export const createTodoInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
});
export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

/** Патч задачи: любое сочетание полей, минимум одно */
export const updateTodoInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    important: z.boolean(),
    done: z.boolean(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, 'Patch must not be empty');
export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;

/** Вход переноса порядка: id задач в новом порядке целиком */
export const reorderTodosInputSchema = z.object({
  ids: z.array(z.uuid()).min(1),
});
export type ReorderTodosInput = z.infer<typeof reorderTodosInputSchema>;

export const todoFilterSchema = z.enum(['all', 'active', 'done']);
export type TodoFilter = z.infer<typeof todoFilterSchema>;

/** Фильтрация по статусу и подстроке заголовка без учета регистра */
export function filterTodos(todos: Todo[], filter: TodoFilter, search: string): Todo[] {
  const query = search.trim().toLowerCase();
  return todos.filter((todo) => {
    const byStatus = filter === 'all' || (filter === 'done' ? todo.done : !todo.done);
    const byQuery = query === '' || todo.title.toLowerCase().includes(query);
    return byStatus && byQuery;
  });
}

/**
 * Новый список с задачей draggedId на месте задачи overId.
 * Если одного из id нет в списке или они совпадают — возвращаем исходный массив без изменений.
 */
export function reorderTodos(todos: Todo[], draggedId: string, overId: string): Todo[] {
  const from = todos.findIndex((todo) => todo.id === draggedId);
  const to = todos.findIndex((todo) => todo.id === overId);
  if (from === -1 || to === -1 || from === to) {
    return todos;
  }
  const next = [...todos];
  const [moved] = next.splice(from, 1);
  if (!moved) {
    return todos;
  }
  next.splice(to, 0, moved);
  return next;
}
