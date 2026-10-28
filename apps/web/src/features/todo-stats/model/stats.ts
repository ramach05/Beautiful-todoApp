import { DEFAULT_LOCALE, type AppLocale } from '@bt/shared';

import type { Todo } from '@/entities/todo';

/** Chart point: todos completed on a specific day */
export interface DailyPoint {
  /** Day key in YYYY-MM-DD format by local timezone */
  key: string;
  /** Short weekday name for the locale (e.g. 'Mon' in en) */
  label: string;
  completed: number;
}

/** Aggregates and series for the stats page; computed deterministically from the todo list */
export interface TodoStats {
  total: number;
  active: number;
  completed: number;
  important: number;
  daily: DailyPoint[];
  oldestIncomplete: Todo | null;
}

const WINDOW_DAYS = 7;

/** Short weekday name via Intl: chart labels follow the UI language */
function formatWeekday(date: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
}

/** Day key YYYY-MM-DD in the local timezone from an ISO string or Date */
function dayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Oldest incomplete by createdAt; on a tie or missing date — first in order */
function findOldestIncomplete(todos: readonly Todo[]): Todo | null {
  let oldest: Todo | null = null;
  for (const todo of todos) {
    if (todo.done) continue;
    if (!oldest) {
      oldest = todo;
      continue;
    }
    if (
      todo.createdAt &&
      oldest.createdAt &&
      new Date(todo.createdAt).getTime() < new Date(oldest.createdAt).getTime()
    ) {
      oldest = todo;
    }
  }
  return oldest;
}

/**
 * Pure aggregation for /stats. now is the reference end-of-window date (current by default),
 * locale is the language of day labels. daily is the WINDOW_DAYS last days including now;
 * completed is counted by the todo's completedAt.
 */
export function computeStats(
  todos: readonly Todo[],
  now: Date = new Date(),
  locale: AppLocale = DEFAULT_LOCALE,
): TodoStats {
  let active = 0;
  let completed = 0;
  let important = 0;
  for (const todo of todos) {
    if (todo.done) completed += 1;
    else active += 1;
    if (todo.important) important += 1;
  }

  const daily: DailyPoint[] = [];
  for (let offset = WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - offset);
    const key = dayKey(day);
    const count = todos.reduce(
      (acc, todo) => (todo.completedAt && dayKey(todo.completedAt) === key ? acc + 1 : acc),
      0,
    );
    daily.push({ key, label: formatWeekday(day, locale), completed: count });
  }

  return {
    total: todos.length,
    active,
    completed,
    important,
    daily,
    oldestIncomplete: findOldestIncomplete(todos),
  };
}
