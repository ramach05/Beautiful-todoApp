import type { CreateTodoInput, Todo, UpdateTodoInput } from '@bt/shared';
import { asc, eq } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import * as schema from './schema.js';
import { todos } from './schema.js';
import type { TodosRepository } from '../repo.js';

type TodosDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Проекция без created_at: наружу отдаем только контрактные поля Todo */
type TodoProjection = Pick<Todo, 'id' | 'title' | 'important' | 'done'>;

const todoColumns = {
  id: todos.id,
  title: todos.title,
  important: todos.important,
  done: todos.done,
};

const toTodo = (row: TodoProjection): Todo => ({
  id: row.id,
  title: row.title,
  important: row.important,
  done: row.done,
});

/** Репозиторий поверх Drizzle (Postgres или PGlite в тестах) */
export class PostgresTodosRepository implements TodosRepository {
  constructor(private readonly db: TodosDb) {}

  async list(): Promise<Todo[]> {
    const rows = await this.db
      .select(todoColumns)
      .from(todos)
      .orderBy(asc(todos.createdAt), asc(todos.id));
    return rows.map(toTodo);
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    const [row] = await this.db.insert(todos).values({ title: input.title }).returning(todoColumns);
    if (!row) {
      throw new Error('INSERT не вернул строку');
    }
    return toTodo(row);
  }

  async update(id: string, patch: UpdateTodoInput): Promise<Todo | null> {
    const [row] = await this.db
      .update(todos)
      .set(patch)
      .where(eq(todos.id, id))
      .returning(todoColumns);
    return row ? toTodo(row) : null;
  }

  async remove(id: string): Promise<boolean> {
    const rows = await this.db.delete(todos).where(eq(todos.id, id)).returning({ id: todos.id });
    return rows.length > 0;
  }
}
