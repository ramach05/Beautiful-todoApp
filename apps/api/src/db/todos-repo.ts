import type { CreateTodoInput, Todo, UpdateTodoInput } from '@bt/shared';
import { asc, and, eq, sql } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import * as schema from '@/db/schema.js';
import { todos } from '@/db/schema.js';
import type { TodosRepository } from '@/repo.js';

type TodosDb = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Проекция контрактных полей + служебные даты и владелец для ограничений */
type TodoProjection = Pick<Todo, 'id' | 'title' | 'important' | 'done'> & {
  createdAt: Date;
  completedAt: Date | null;
  userId: string;
};
type TodoInsert = typeof todos.$inferInsert;

const todoColumns = {
  id: todos.id,
  title: todos.title,
  important: todos.important,
  done: todos.done,
  createdAt: todos.createdAt,
  completedAt: todos.completedAt,
  userId: todos.userId,
};

// Даты наружу отдаем ISO-строками: контракт валидирует вывод, Date-объект zod не примет
const toTodo = (row: TodoProjection): Todo => ({
  id: row.id,
  title: row.title,
  important: row.important,
  done: row.done,
  createdAt: row.createdAt.toISOString(),
  completedAt: row.completedAt?.toISOString() ?? null,
});

/** Репозиторий задач на Postgres; все операции ограничены владельцем (user_id) */
export class PostgresTodosRepository implements TodosRepository {
  constructor(private readonly db: TodosDb) {}

  async list(userId: string): Promise<Todo[]> {
    const rows = await this.db
      .select(todoColumns)
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(asc(todos.position), asc(todos.createdAt), asc(todos.id));
    return rows.map(toTodo);
  }

  async create(input: CreateTodoInput, userId: string): Promise<Todo> {
    // position = следующая свободная позиция владельца: новая задача попадает в конец списка
    const [row] = await this.db
      .insert(todos)
      .values({
        title: input.title,
        userId,
        position: sql`(select coalesce(max(${todos.position}), -1) + 1 from ${todos} where ${todos.userId} = ${userId})`,
      })
      .returning(todoColumns);
    if (!row) {
      throw new Error('INSERT не вернул строку');
    }
    return toTodo(row);
  }

  async update(id: string, patch: UpdateTodoInput, userId: string): Promise<Todo | null> {
    // completedAt проставляем/сбрасываем по переходу done, чтобы график выполнялся по реальным датам
    const data: Partial<TodoInsert> = { ...patch };
    if (patch.done === true) data.completedAt = new Date();
    else if (patch.done === false) data.completedAt = null;

    const [row] = await this.db
      .update(todos)
      .set(data)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning(todoColumns);
    return row ? toTodo(row) : null;
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, userId)))
      .returning({ id: todos.id });
    return deleted.length > 0;
  }

  async reorder(ids: string[], userId: string): Promise<Todo[]> {
    // порядок позициями индексов; чужие id не матчатся где-условием и молча игнорируются
    await this.db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx
          .update(todos)
          .set({ position: index })
          .where(and(eq(todos.id, id), eq(todos.userId, userId)));
      }
    });
    return this.list(userId);
  }
}
