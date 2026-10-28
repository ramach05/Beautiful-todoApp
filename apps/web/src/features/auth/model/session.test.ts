import { beforeEach, expect, it, vi } from 'vitest';

// A network failure of get-session (unreachable api or CORS when Vite changes port) is no reason not to mount the app
vi.mock('./auth', () => ({
  authClient: {
    getSession: vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
  },
}));

beforeEach(() => {
  vi.resetModules();
});

it('a failed get-session resolves as no session', async () => {
  // Mock mode is on in the test environment: switch the module to the real getSession path
  vi.stubEnv('VITE_USE_MOCKS', '0');
  const { sessionReady, $session } = await import('./session');
  await expect(sessionReady).resolves.toBeUndefined();
  expect($session.getState()).toBeNull();
  vi.unstubAllEnvs();
});
