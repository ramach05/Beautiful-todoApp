import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

import type { AppContractClient } from '@bt/shared';

const RPC_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/rpc';
const useMocks = import.meta.env.VITE_USE_MOCKS === '1';
/** Путь префикса RPC: мок-хендлер матчит процедуры только после него; pathname всегда начинается с "/" */
const RPC_PREFIX = (new URL(RPC_URL, window.location.origin).pathname.replace(/\/$/, '') ||
  '/') as `/${string}`;

/** Ленивая загрузка in-process мока: в прод-бандл не попадает (ветка отсечается define) */
async function mockTransport(request: Request): Promise<Response> {
  const { handleMockRequest } = await import('../../../mocks/mock-client');
  return handleMockRequest(request, RPC_PREFIX);
}

/** Типизированный клиент контракта @bt/api: все вызовы проверяются компилятором */
export const api: AppContractClient = createORPCClient(
  new RPCLink({ url: RPC_URL, fetch: useMocks ? mockTransport : undefined }),
);
