import type { Todo } from '@bt/shared';

/** In-memory БД MSW: сид совпадает с legacy-задачами, id - uuid как у реального API */
function seed(): Todo[] {
  return [
    { id: crypto.randomUUID(), title: 'Сходить в магазин', important: false, done: false },
    { id: crypto.randomUUID(), title: 'Позвонить маме', important: true, done: false },
    { id: crypto.randomUUID(), title: 'Сделать ДЗ', important: false, done: false },
    { id: crypto.randomUUID(), title: 'Погладить рубашку', important: false, done: false },
  ];
}

let items: Todo[] = seed();

export const db = {
  all: (): Todo[] => items,
  find: (id: string): Todo | undefined => items.find((todo) => todo.id === id),
  create: (title: string): Todo => {
    const todo: Todo = { id: crypto.randomUUID(), title, important: false, done: false };
    items = [...items, todo];
    return todo;
  },
  update: (id: string, patch: Partial<Omit<Todo, 'id'>>): Todo | undefined => {
    const target = items.find((todo) => todo.id === id);
    if (!target) return undefined;
    Object.assign(target, patch);
    return target;
  },
  remove: (id: string): boolean => {
    const before = items.length;
    items = items.filter((todo) => todo.id !== id);
    return items.length < before;
  },
  reset: (): void => {
    items = seed();
  },
};
