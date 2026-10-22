import { z } from 'zod';

/** Задача: id генерирует сервер (uuid), остальные поля приходят из форм и API */
export const todoSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(200),
  important: z.boolean(),
  done: z.boolean(),
});
export type Todo = z.infer<typeof todoSchema>;

/** Ответ списка задач */
export const todoListSchema = z.array(todoSchema);

/** Вход создания: id и флаги по умолчанию формирует сервер */
export const createTodoInputSchema = z.object({
  title: z.string().trim().min(1, 'Заголовок обязателен').max(200),
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
  .refine((patch) => Object.keys(patch).length > 0, 'Патч не пустой');
export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;

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
