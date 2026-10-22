import { ORPCError, implement } from '@orpc/server';

import { appContract } from '@bt/shared';

import type { TodosRepository } from './repo.js';

export interface Context {
  todos: TodosRepository;
}

const appProcedure = implement(appContract).$context<Context>();

/** Реализация oRPC-контракта; валидация input/output выполняется самим oRPC по zod-схемам */
export const appRouter = {
  todos: {
    list: appProcedure.todos.list.handler(({ context }) => context.todos.list()),

    create: appProcedure.todos.create.handler(({ input, context }) => context.todos.create(input)),

    update: appProcedure.todos.update.handler(async ({ input, context }) => {
      const updated = await context.todos.update(input.id, input.patch);
      if (!updated) {
        throw new ORPCError('NOT_FOUND');
      }
      return updated;
    }),

    remove: appProcedure.todos.remove.handler(async ({ input, context }) => {
      const removed = await context.todos.remove(input);
      if (!removed) {
        throw new ORPCError('NOT_FOUND');
      }
    }),
  },
};

export type AppRouter = typeof appRouter;
