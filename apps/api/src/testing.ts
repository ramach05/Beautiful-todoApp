import type { CreateTodoInput, Todo, UpdateTodoInput } from '@bt/shared';

import type { AppUser, TodosRepository } from './repo.js';

const SEED_TITLES = ['Buy groceries', 'Call mom', 'Do homework', 'Iron the shirt'];

/** Фиксированный пользователь in-process мока (dev и тесты web) */
export const DEMO_USER: AppUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@local.test',
  locale: 'en',
};

type OwnedTodo = Todo & { userId: string };

/** In-memory репозиторий: мок-бэкенд web в dev/тестах и юнит-тесты; видны только задачи владельца */
export class InMemoryTodosRepository implements TodosRepository {
  private items: OwnedTodo[] = [];

  constructor(seed: boolean = true) {
    if (seed) {
      this.reset();
    }
  }

  reset(): void {
    const now = new Date().toISOString();
    this.items = SEED_TITLES.map((title) => ({
      id: crypto.randomUUID(),
      title,
      important: false,
      done: false,
      createdAt: now,
      completedAt: null,
      userId: DEMO_USER.id,
    }));
  }

  async list(userId: string): Promise<Todo[]> {
    return this.items
      .filter((item) => item.userId === userId)
      .map(({ userId: _, ...todo }) => todo);
  }

  async create(input: CreateTodoInput, userId: string): Promise<Todo> {
    const item: OwnedTodo = {
      id: crypto.randomUUID(),
      title: input.title,
      important: false,
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      userId,
    };
    this.items = [...this.items, item];
    const { userId: _, ...todo } = item;
    return todo;
  }

  async update(id: string, patch: UpdateTodoInput, userId: string): Promise<Todo | null> {
    const current = this.items.find((item) => item.id === id && item.userId === userId);
    if (!current) return null;
    // completedAt живет по переходу done: ставим при выполнении, сбрасываем при возврате в активные
    const completedAt =
      patch.done === true
        ? new Date().toISOString()
        : patch.done === false
          ? null
          : current.completedAt;
    const updated: OwnedTodo = { ...current, ...patch, completedAt };
    this.items = this.items.map((item) =>
      item.id === id && item.userId === userId ? updated : item,
    );
    const { userId: _, ...todo } = updated;
    return todo;
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((item) => !(item.id === id && item.userId === userId));
    return this.items.length < before;
  }

  async reorder(ids: string[], userId: string): Promise<Todo[]> {
    // порядок задач владельца задает массив; чужие id игнорируются, не названные идут в конец
    const owned = this.items.filter((item) => item.userId === userId);
    const byId = new Map(owned.map((item) => [item.id, item]));
    const picked: OwnedTodo[] = [];
    for (const id of ids) {
      const item = byId.get(id);
      if (item) {
        picked.push(item);
        byId.delete(id);
      }
    }
    const ordered = [...picked, ...owned.filter((item) => byId.has(item.id))];
    let cursor = 0;
    this.items = this.items.map((item) =>
      item.userId === userId ? (ordered[cursor++] ?? item) : item,
    );
    return ordered.map(({ userId: _, ...todo }) => todo);
  }
}
