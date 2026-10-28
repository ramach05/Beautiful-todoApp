/**
 * Thin layer over @bt/shared: the UI depends on the domain entity through entities,
 * not by importing shared directly
 */
export type { Todo, TodoFilter, CreateTodoInput, UpdateTodoInput } from '@bt/shared';
export {
  filterTodos,
  reorderTodos,
  todoFilterSchema,
  createTodoInputSchema,
  updateTodoInputSchema,
} from '@bt/shared';
