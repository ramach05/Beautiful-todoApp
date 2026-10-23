import type { Todo } from '@/entities/todo';

/** Точка графика: выполнено задач в конкретный день */
export interface DailyPoint {
  /** Ключ дня в формате YYYY-MM-DD по локальной таймзоне */
  key: string;
  /** Короткое имя дня недели (Mon) */
  label: string;
  completed: number;
}

/** Агрегаты и ряды для страницы статистики; считаются детерминированно из списка задач */
export interface TodoStats {
  total: number;
  active: number;
  completed: number;
  important: number;
  daily: DailyPoint[];
  oldestIncomplete: Todo | null;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WINDOW_DAYS = 7;

/** Ключ дня YYYY-MM-DD по локальной таймзоне из ISO-строки или Date */
function dayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Самое старое незавершенное по createdAt; при равенстве или отсутствии даты — первое по порядку */
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
 * Чистая агрегация для /stats. now — опорная дата конца окна (по умолчанию текущая).
 * daily — WINDOW_DAYS последних дней включая now; completed считается по completedAt задачи.
 */
export function computeStats(todos: readonly Todo[], now: Date = new Date()): TodoStats {
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
    daily.push({ key, label: WEEKDAY_LABELS[day.getDay()] ?? '', completed: count });
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
