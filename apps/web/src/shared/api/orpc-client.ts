import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

import type { AppContractClient } from '@bt/shared';

const RPC_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/rpc';
// Inlined condition: vite drops the mock branch from the prod bundle only on a literal comparison
const useMocks = import.meta.env.VITE_USE_MOCKS === '1';
/** RPC prefix path: the mock handler matches procedures only after it; pathname always starts with "/" */
const RPC_PREFIX = (new URL(RPC_URL, window.location.origin).pathname.replace(/\/$/, '') ||
  '/') as `/${string}`;

/** The better-auth session cookie must be sent with every RPC request (incl. cross-origin in dev) */
async function credentialedTransport(request: Request): Promise<Response> {
  // x-request-id for FE->BE log correlation (fastify genReqId picks it up)
  request.headers.set('x-request-id', crypto.randomUUID());
  return fetch(request, { credentials: 'include' });
}

/** Lazy load of the in-process mock: kept out of the prod bundle (branch cut off by define); the mock itself is dev/test infrastructure */
async function mockTransport(request: Request): Promise<Response> {
  const { handleMockRequest } = await import('@/shared/mocks');
  return handleMockRequest(request, RPC_PREFIX);
}

/** Typed @bt/api contract client: all calls are checked by the compiler */
export const api: AppContractClient = createORPCClient(
  new RPCLink({ url: RPC_URL, fetch: useMocks ? mockTransport : credentialedTransport }),
);
