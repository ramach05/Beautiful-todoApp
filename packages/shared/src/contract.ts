import { oc } from '@orpc/contract';
import type { ContractRouterClient } from '@orpc/contract';
import { z } from 'zod';

import {
  createTodoInputSchema,
  reorderTodosInputSchema,
  todoListSchema,
  todoSchema,
  updateTodoInputSchema,
} from './todo.js';

/** Base procedure: all domain procedures require a session, the error is typed in the contract */
const authed = oc.errors({ UNAUTHORIZED: { message: 'Unauthorized' } });

/**
 * oRPC contract - the single source of truth for api and web:
 * the server implements it via implement(), the client calls it typed without codegen
 */
export const todoContract = {
  list: authed.output(todoListSchema),
  create: authed.input(createTodoInputSchema).output(todoSchema),
  update: authed.input(z.object({ id: z.uuid(), patch: updateTodoInputSchema })).output(todoSchema),
  remove: authed.input(z.uuid()),
  reorder: authed.input(reorderTodosInputSchema).output(todoListSchema),
};

/** Root app contract: adding a domain = a new branch here */
export const appContract = {
  todos: todoContract,
};

/** Typed client type for createORPCClient (web and api tests) */
export type AppContractClient = ContractRouterClient<typeof appContract>;
