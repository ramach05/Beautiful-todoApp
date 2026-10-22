import type { CreateTodoInput, Todo, UpdateTodoInput } from '@bt/shared';

import type { TodosRepository } from './repo.js';

const SEED_TITLES = ['Сходить в магазин', 'Позвонить маме', 'Сделать ДЗ', 'Погладить рубашку'];

/** In-memory репозиторий: мок-бэкенд web в dev/тестах и юнит-тесты */
export class InMemoryTodosRepository implements TodosRepository {
  private items: Todo[] = [];

  constructor(seed: boolean = true) {
    if (seed) {
      this.reset();
    }
  }

  reset(): void {
    this.items = SEED_TITLES.map((title) => ({
      id: crypto.randomUUID(),
      title,
      important: false,
      done: false,
    }));
  }

  async list(): Promise<Todo[]> {
    return this.items.map((todo) => ({ ...todo }));
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: input.title,
      important: false,
      done: false,
    };
    this.items = [...this.items, todo];
    return { ...todo };
  }

  async update(id: string, patch: UpdateTodoInput): Promise<Todo | null> {
    const index = this.items.findIndex((todo) => todo.id === id);
    if (index === -1) return null;
    const current = this.items[index];
    if (!current) return null;
    const updated: Todo = { ...current, ...patch };
    this.items = this.items.map((todo) => (todo.id === id ? updated : todo));
    return { ...updated };
  }

  async remove(id: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((todo) => todo.id !== id);
    return this.items.length < before;
  }
}
