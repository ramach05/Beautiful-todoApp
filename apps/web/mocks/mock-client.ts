import { RPCHandler } from '@orpc/server/fetch';
import { appRouter } from '@bt/api/router';
import { DEMO_USER, InMemoryTodosRepository } from '@bt/api/testing';

/** Общие данные мока: сбрасываются между тестами через reset() */
export const mockTodos = new InMemoryTodosRepository();

const handler = new RPCHandler(appRouter);

/** Обработка запроса oRPC-клиента in-process (dev и тесты без запущенного api) */
export async function handleMockRequest(request: Request, prefix: `/${string}`): Promise<Response> {
  const result = await handler.handle(request, {
    context: {
      todos: mockTodos,
      session: { resolve: async () => DEMO_USER },
      headers: new Headers(),
    },
    prefix,
  });
  if (!result.matched) {
    return new Response('Not Found', { status: 404 });
  }
  return result.response;
}
