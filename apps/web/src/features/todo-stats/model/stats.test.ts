import { describe, expect, it } from 'vitest';

import type { Todo } from '@/entities/todo';

import { computeStats } from './stats';

// Local ISO strings without Z: new Date treats them as local time, so dayKey is stable in any TZ
function iso(y: number, m: number, d: number, hh = 9): string {
  return new Date(y, m - 1, d, hh, 0, 0).toISOString();
}

function todo(overrides: Partial<Todo> & Pick<Todo, 'title'>): Todo {
  return {
    id: crypto.randomUUID(),
    title: overrides.title,
    important: overrides.important ?? false,
    done: overrides.done ?? false,
    createdAt: overrides.createdAt ?? iso(2026, 10, 10),
    completedAt: overrides.completedAt ?? null,
  };
}

describe('computeStats', () => {
  const now = new Date(2026, 9, 23, 12, 0, 0);

  const todos: Todo[] = [
    todo({ title: 'done-today', done: true, completedAt: iso(2026, 10, 23) }),
    todo({ title: 'done-2-days-ago', done: true, completedAt: iso(2026, 10, 21) }),
    todo({ title: 'done-old', done: true, completedAt: iso(2026, 9, 1) }),
    todo({ title: 'oldest-open', important: true, createdAt: iso(2026, 10, 15) }),
    todo({ title: 'recent-open', createdAt: iso(2026, 10, 18) }),
  ];

  it('computes totals', () => {
    const stats = computeStats(todos, now);
    expect(stats).toMatchObject({ total: 5, active: 2, completed: 3, important: 1 });
  });

  it('builds a 7-day window with done counts', () => {
    const { daily } = computeStats(todos, now);
    expect(daily).toHaveLength(7);
    expect(daily.at(-1)).toMatchObject({ key: '2026-10-23', completed: 1 });
    // Day labels — Intl by locale: en short format without a dot
    expect(daily.at(-1)?.label).toBe('Fri');
    expect(computeStats(todos, now, 'ru').daily.at(-1)?.label).toBe('пт');
    expect(daily.find((point) => point.key === '2026-10-21')?.completed).toBe(1);
    // completed outside the window (2026-09-01) falls into none of the 7 days
    expect(daily.reduce((sum, point) => sum + point.completed, 0)).toBe(2);
  });
});
