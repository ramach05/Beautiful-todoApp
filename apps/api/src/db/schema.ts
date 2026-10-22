import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Таблица задач; created_at нужен для стабильного порядка списка */
export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  important: boolean('important').notNull().default(false),
  done: boolean('done').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TodoRow = typeof todos.$inferSelect;
