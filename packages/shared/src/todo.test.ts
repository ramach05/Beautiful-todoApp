import { expect, it } from 'vitest';

import {
  createTodoInputSchema,
  filterTodos,
  reorderTodos,
  reorderTodosInputSchema,
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

// Тесты мутабельных пакетов держим плоскими (без describe): per-test фильтр Stryker с vitest 5
// не матчит вложенные тесты, и мутанты остаются живыми при наличии покрытия.

it('todoSchema валидирует корректную задачу', () => {
  expect(todoSchema.safeParse(todo()).success).toBe(true);
});

it('todoSchema отклоняет пустой и слишком длинный заголовок', () => {
  expect(todoSchema.safeParse({ ...todo(), title: '   ' }).success).toBe(false);
  expect(todoSchema.safeParse({ ...todo(), title: 'a'.repeat(201) }).success).toBe(false);
});

it('todoSchema требует uuid в качестве id', () => {
  expect(todoSchema.safeParse({ ...todo(), id: '1' }).success).toBe(false);
});

it('createTodoInputSchema принимает заголовок и обрезает его', () => {
  expect(createTodoInputSchema.parse({ title: '  Купить кофе  ' })).toEqual({
    title: 'Купить кофе',
  });
});

it('createTodoInputSchema отклоняет пустой и слишком длинный заголовок', () => {
  expect(createTodoInputSchema.safeParse({ title: '   ' }).success).toBe(false);
  expect(createTodoInputSchema.safeParse({ title: 'a'.repeat(201) }).success).toBe(false);
});

it('createTodoInputSchema отдает код too_small для пустого заголовка: текст переводит UI', () => {
  const issue = createTodoInputSchema.safeParse({ title: '' }).error?.issues[0];
  expect(issue?.code).toBe('too_small');
});

it('updateTodoInputSchema принимает любой непустой патч', () => {
  expect(updateTodoInputSchema.safeParse({ done: true }).success).toBe(true);
  expect(updateTodoInputSchema.safeParse({ important: true, title: 'Новая' }).success).toBe(true);
});

it('updateTodoInputSchema отклоняет пустой патч с текстовой ошибкой', () => {
  const result = updateTodoInputSchema.safeParse({});
  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.message).toBe('Patch must not be empty');
});

it('updateTodoInputSchema отклоняет некорректный заголовок в патче', () => {
  expect(updateTodoInputSchema.safeParse({ title: '   ' }).success).toBe(false);
  expect(updateTodoInputSchema.safeParse({ title: 'a'.repeat(201) }).success).toBe(false);
});

it('todoFilterSchema принимает все три фильтра и отклоняет посторонние значения', () => {
  expect(todoFilterSchema.options).toEqual(['all', 'active', 'done']);
  expect(todoFilterSchema.safeParse('done').success).toBe(true);
  expect(todoFilterSchema.safeParse('unknown').success).toBe(false);
});

it('filterTodos: all возвращает все задачи, поиск из пробелов не ограничивает выдачу', () => {
  expect(filterTodos(items, 'all', '')).toHaveLength(3);
  expect(filterTodos(items, 'active', '   ')).toHaveLength(2);
});

it('filterTodos: active и done фильтруют по статусу', () => {
  expect(filterTodos(items, 'done', '')).toEqual([items[1]]);
  expect(filterTodos(items, 'active', '')).toHaveLength(2);
});

it('filterTodos: ищет по подстроке без учета регистра', () => {
  expect(filterTodos(items, 'all', 'ПОЗВОНИТЬ')).toHaveLength(2);
});

it('filterTodos: комбинирует статус и поиск', () => {
  expect(filterTodos(items, 'active', 'маме')).toHaveLength(1);
  expect(filterTodos(items, 'done', 'маме')).toHaveLength(0);
});

it('reorderTodosInputSchema принимает непустой массив uuid и отклоняет мусор', () => {
  expect(reorderTodosInputSchema.safeParse({ ids: [crypto.randomUUID()] }).success).toBe(true);
  expect(reorderTodosInputSchema.safeParse({ ids: [] }).success).toBe(false);
  expect(reorderTodosInputSchema.safeParse({ ids: ['not-a-uuid'] }).success).toBe(false);
});

it('reorderTodos ставит переносимую задачу на место целевой', () => {
  const next = reorderTodos(items, third.id, first.id);
  expect(next.map((todo) => todo.title)).toEqual(['Позвонить врачу', 'Позвонить маме', 'Магазин']);
});

it('reorderTodos не меняет список при совпадении id или отсутствии одного из них', () => {
  expect(reorderTodos(items, first.id, first.id)).toBe(items);
  expect(reorderTodos(items, crypto.randomUUID(), first.id)).toBe(items);
  expect(reorderTodos(items, first.id, crypto.randomUUID())).toBe(items);
});
