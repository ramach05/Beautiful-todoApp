import { expect, it } from 'vitest';

import {
  createTodoInputSchema,
  filterTodos,
  reorderTodos,
  todoFilterSchema,
  todoSchema,
  updateTodoInputSchema,
  type Todo,
} from './todo.js';

const todo = (overrides: Partial<Todo> = {}): Todo => ({
  id: crypto.randomUUID(),
  title: 'Тест',
  important: false,
  done: false,
  ...overrides,
});

const first = todo({ title: 'Позвонить маме' });
const second = todo({ title: 'Магазин', done: true });
const third = todo({ title: 'Позвонить врачу', important: true });
const items = [first, second, third];

// Keep mutable-package tests flat (no describe): the Stryker per-test filter with vitest 5
// does not match nested tests, so mutants survive even when covered.

it('todoSchema validates a well-formed todo', () => {
  expect(todoSchema.safeParse(todo()).success).toBe(true);
});

it('todoSchema rejects an empty or oversized title', () => {
  expect(todoSchema.safeParse({ ...todo(), title: '   ' }).success).toBe(false);
  expect(todoSchema.safeParse({ ...todo(), title: 'a'.repeat(201) }).success).toBe(false);
});

it('createTodoInput trims the title', () => {
  expect(createTodoInputSchema.parse({ title: '  Купить кофе  ' })).toEqual({
    title: 'Купить кофе',
  });
});

it('createTodoInput rejects an empty or oversized title', () => {
  expect(createTodoInputSchema.safeParse({ title: '   ' }).success).toBe(false);
  expect(createTodoInputSchema.safeParse({ title: 'a'.repeat(201) }).success).toBe(false);
});

it('updateTodoInput accepts a non-empty patch and rejects an empty one', () => {
  expect(updateTodoInputSchema.safeParse({ done: true }).success).toBe(true);
  expect(updateTodoInputSchema.safeParse({ important: true, title: 'Новая' }).success).toBe(true);
  expect(updateTodoInputSchema.safeParse({}).success).toBe(false);
});

it('todoFilterSchema accepts only known filters', () => {
  expect(todoFilterSchema.safeParse('done').success).toBe(true);
  expect(todoFilterSchema.safeParse('unknown').success).toBe(false);
});

it('filterTodos filters by status and search text', () => {
  expect(filterTodos(items, 'all', '')).toHaveLength(3);
  expect(filterTodos(items, 'done', '')).toEqual([items[1]]);
  expect(filterTodos(items, 'active', '')).toHaveLength(2);
  expect(filterTodos(items, 'all', 'ПОЗВОНИТЬ')).toHaveLength(2);
  expect(filterTodos(items, 'active', 'маме')).toHaveLength(1);
});

it('reorderTodos moves a todo to the target position', () => {
  const next = reorderTodos(items, third.id, first.id);
  expect(next.map((todo) => todo.title)).toEqual(['Позвонить врачу', 'Позвонить маме', 'Магазин']);
});
