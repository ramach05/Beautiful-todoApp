import { z } from 'zod';

import { type TodoFilter, todoFilterSchema } from '@/entities/todo';

/** Search-параметры роута /: отсутствие ключа означает значение по умолчанию (all / пустой поиск) */
export interface TodoSearch {
  filter?: TodoFilter;
  q?: string;
}

// catch на каждом поле: мусор в URL (чужой filter, массив вместо строки) схлопывается в дефолт, а не роняет страницу
const searchSchema = z.object({
  filter: todoFilterSchema.catch('all'),
  q: z.string().max(200).trim().catch(''),
});

/** Разбор search-параметров для validateSearch роута / — источник истины фильтров (ADR-002) */
export function parseTodoSearch(search: Record<string, unknown>): TodoSearch {
  const parsed = searchSchema.safeParse(search);
  return parsed.success ? buildTodoSearch(parsed.data) : {};
}

/** Сборка параметров для navigate: значения по умолчанию в URL не попадают */
export function buildTodoSearch(values: { filter: TodoFilter; q: string }): TodoSearch {
  return {
    filter: values.filter === 'all' ? undefined : values.filter,
    q: values.q === '' ? undefined : values.q,
  };
}
