/**
 * Тонкая прослойка над @bt/shared: UI зависит от доменной сущности через entities,
 * а не импортирует shared напрямую
 */
export type { Todo, TodoFilter, CreateTodoInput, UpdateTodoInput } from '@bt/shared';
export {
  filterTodos,
  reorderTodos,
  todoFilterSchema,
  createTodoInputSchema,
  updateTodoInputSchema,
} from '@bt/shared';
