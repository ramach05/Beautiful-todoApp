/** Доменная сущность задачи: контракт совпадает с zod-схемой @bt/shared (PR-4) */
export interface Todo {
  id: number;
  title: string;
  important: boolean;
  done: boolean;
}

export type TodoFilter = 'all' | 'active' | 'done';

/** Стартовый набор задач, перенесенный из legacy-версии */
export const seedTodos: Todo[] = [
  { id: 1, title: 'Сходить в магазин', important: false, done: false },
  { id: 2, title: 'Позвонить маме', important: true, done: false },
  { id: 3, title: 'Сделать ДЗ', important: false, done: false },
  { id: 4, title: 'Погладить рубашку', important: false, done: false },
];

/** Фильтрация по статусу и подстроке заголовка без учета регистра */
export function filterTodos(todos: Todo[], filter: TodoFilter, search: string): Todo[] {
  const query = search.trim().toLowerCase();
  return todos.filter((todo) => {
    const byStatus = filter === 'all' || (filter === 'done' ? todo.done : !todo.done);
    const byQuery = query === '' || todo.title.toLowerCase().includes(query);
    return byStatus && byQuery;
  });
}
