import { describe, expect, it } from 'vitest';
import { filterTodos, todoSchema, updateTodoInputSchema, type Todo } from './todo.js';

const todo = (overrides: Partial<Todo> = {}): Todo => ({
  id: crypto.randomUUID(),
  title: 'Тест',
  important: false,
  done: false,
  ...overrides,
});

describe('todoSchema', () => {
  it('валидирует корректную задачу', () => {
    expect(todoSchema.safeParse(todo()).success).toBe(true);
  });

  it('отклоняет пустой заголовок', () => {
    expect(todoSchema.safeParse({ ...todo(), title: '   ' }).success).toBe(false);
  });

  it('требует uuid в качестве id', () => {
    expect(todoSchema.safeParse({ ...todo(), id: '1' }).success).toBe(false);
  });
});

describe('updateTodoInputSchema', () => {
  it('принимает непустой патч', () => {
    expect(updateTodoInputSchema.safeParse({ done: true }).success).toBe(true);
  });

  it('отклоняет пустой патч', () => {
    expect(updateTodoInputSchema.safeParse({}).success).toBe(false);
  });
});

describe('filterTodos', () => {
  const items = [
    todo({ title: 'Позвонить маме' }),
    todo({ title: 'Магазин', done: true }),
    todo({ title: 'Позвонить врачу', important: true }),
  ];

  it('all без поиска возвращает все', () => {
    expect(filterTodos(items, 'all', '')).toHaveLength(3);
  });

  it('active и done фильтруют по статусу', () => {
    expect(filterTodos(items, 'done', '')).toEqual([items[1]]);
    expect(filterTodos(items, 'active', '')).toHaveLength(2);
  });

  it('ищет по подстроке без учета регистра', () => {
    expect(filterTodos(items, 'all', 'ПОЗВОНИТЬ')).toHaveLength(2);
  });

  it('комбинирует статус и поиск', () => {
    expect(filterTodos(items, 'active', 'маме')).toHaveLength(1);
  });
});
