import { ORPCError, implement } from '@orpc/server';

import { appContract } from '@bt/shared';

import type { SessionResolver, TodosRepository } from './repo.js';

export interface Context {
  todos: TodosRepository;
  session: SessionResolver;
  headers: Headers;
}

/** Единая проверка сессии для всех процедур: без нее — типизированная UNAUTHORIZED из контракта */
const appProcedure = implement(appContract)
  .$context<Context>()
  .use(async ({ context, next }) => {
    const user = await context.session.resolve(context.headers);
    if (!user) {
      throw new ORPCError('UNAUTHORIZED');
    }
    return next({ context: { user } });
  });

/** Реализация oRPC-контракта; валидация input/output выполняется самим oRPC по zod-схемам */
export const appRouter = {
  todos: {
    list: appProcedure.todos.list.handler(({ context }) => context.todos.list(context.user.id)),

    create: appProcedure.todos.create.handler(({ input, context }) =>
      context.todos.create(input, context.user.id),
    ),

    update: appProcedure.todos.update.handler(async ({ input, context }) => {
      const updated = await context.todos.update(input.id, input.patch, context.user.id);
      if (!updated) {
        throw new ORPCError('NOT_FOUND');
      }
      return updated;
    }),

    remove: appProcedure.todos.remove.handler(async ({ input, context }) => {
      const removed = await context.todos.remove(input, context.user.id);
      if (!removed) {
        throw new ORPCError('NOT_FOUND');
      }
    }),

    reorder: appProcedure.todos.reorder.handler(({ input, context }) =>
      context.todos.reorder(input.ids, context.user.id),
    ),
  },
};
