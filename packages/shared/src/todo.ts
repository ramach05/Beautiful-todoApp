import { z } from 'zod';

/**
 * Todo: the server generates id and dates (uuid + ISO). createdAt is the moment of creation,
 * completedAt is the moment of completion or null if the todo is not done yet.
 * Dates are optional in the contract for backward compatibility, but the api always returns them.
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

/** Todo list response */
export const todoListSchema = z.array(todoSchema);

/** Create input: the server generates id and default flags; the UI localizes error texts by issues code */
export const createTodoInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
});
export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

/** Todo patch: any combination of fields, at least one */
export const updateTodoInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    important: z.boolean(),
    done: z.boolean(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, 'Patch must not be empty');
export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;

/** Reorder input: all todo ids in the new order */
export const reorderTodosInputSchema = z.object({
  ids: z.array(z.uuid()).min(1),
});
export type ReorderTodosInput = z.infer<typeof reorderTodosInputSchema>;

export const todoFilterSchema = z.enum(['all', 'active', 'done']);
export type TodoFilter = z.infer<typeof todoFilterSchema>;

/** Filter by status and case-insensitive title substring */
export function filterTodos(todos: Todo[], filter: TodoFilter, search: string): Todo[] {
  const query = search.trim().toLowerCase();
  return todos.filter((todo) => {
    const byStatus = filter === 'all' || (filter === 'done' ? todo.done : !todo.done);
    const byQuery = query === '' || todo.title.toLowerCase().includes(query);
    return byStatus && byQuery;
  });
}

/**
 * New list with the draggedId todo at the position of the overId todo.
 * If one of the ids is missing from the list or they are equal — return the original array unchanged.
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
