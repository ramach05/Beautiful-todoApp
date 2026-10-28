import { z } from 'zod';

import { type TodoFilter, todoFilterSchema } from '@/entities/todo';

/** Route / search-params: a missing key means the default value (all / empty search) */
export interface TodoSearch {
  filter?: TodoFilter;
  q?: string;
}

// catch on each field: garbage in the URL (foreign filter, array instead of string) collapses to the default instead of crashing the page
const searchSchema = z.object({
  filter: todoFilterSchema.catch('all'),
  q: z.string().max(200).trim().catch(''),
});

/** Parses search-params for route / — the source of truth for filters */
export function parseTodoSearch(search: Record<string, unknown>): TodoSearch {
  const parsed = searchSchema.safeParse(search);
  return parsed.success ? buildTodoSearch(parsed.data) : {};
}

/** Builds params for navigate: default values do not end up in the URL */
export function buildTodoSearch(values: { filter: TodoFilter; q: string }): TodoSearch {
  return {
    filter: values.filter === 'all' ? undefined : values.filter,
    q: values.q === '' ? undefined : values.q,
  };
}
