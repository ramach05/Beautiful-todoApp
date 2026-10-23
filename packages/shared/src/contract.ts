import { oc } from '@orpc/contract';
import type { ContractRouterClient } from '@orpc/contract';
import { z } from 'zod';

import {
  createTodoInputSchema,
  todoListSchema,
  todoSchema,
  updateTodoInputSchema,
} from './todo.js';

/** Базовая процедура: все доменные процедуры требуют сессию, ошибка типизирована в контракте */
const authed = oc.errors({ UNAUTHORIZED: { message: 'Unauthorized' } });

/**
 * oRPC-контракт - единая точка истины для api и web (ADR-003):
 * сервер реализует его через implement(), клиент вызывает типизированно без кодогенерации
 */
export const todoContract = {
  list: authed.output(todoListSchema),
  create: authed.input(createTodoInputSchema).output(todoSchema),
  update: authed.input(z.object({ id: z.uuid(), patch: updateTodoInputSchema })).output(todoSchema),
  remove: authed.input(z.uuid()),
};

/** Корневой контракт приложения: добавление доменов = новая ветка здесь */
export const appContract = {
  todos: todoContract,
};

/** Тип типизированного клиента для createORPCClient (web и тесты api) */
export type AppContractClient = ContractRouterClient<typeof appContract>;
