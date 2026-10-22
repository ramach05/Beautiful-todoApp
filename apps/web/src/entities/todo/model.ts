/**
 * Тонкая прослойка над @bt/shared: UI зависит от доменной сущности через entities,
 * а не импортирует shared напрямую (ADR-002)
 */
export type { Todo, TodoFilter, CreateTodoInput, UpdateTodoInput } from '@bt/shared';
export { filterTodos, createTodoInputSchema, updateTodoInputSchema } from '@bt/shared';
