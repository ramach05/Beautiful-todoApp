import { beforeEach, expect, it, vi } from 'vitest';

// Сетевой провал get-session (недоступный api или CORS при смене порта Vite) — не причина не монтировать приложение
vi.mock('./auth', () => ({
  authClient: {
    getSession: vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
  },
}));

beforeEach(() => {
  vi.resetModules();
});

it('a failed get-session resolves as no session', async () => {
  // В тестовом окружении включен режим моков: переключаем модуль на реальный путь getSession
  vi.stubEnv('VITE_USE_MOCKS', '0');
  const { sessionReady, $session } = await import('./session');
  await expect(sessionReady).resolves.toBeUndefined();
  expect($session.getState()).toBeNull();
  vi.unstubAllEnvs();
});
