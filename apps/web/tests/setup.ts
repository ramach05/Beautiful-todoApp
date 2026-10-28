import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import { signOutStarted } from '@/features/auth';
import '@/shared/i18n';
import { mockTodos } from '@/shared/mocks';

// jsdom does not implement ResizeObserver, and dnd-kit uses it to observe list row sizes
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (globalThis.ResizeObserver === undefined) {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom does not implement matchMedia; animation preference in tests is "no-preference"
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Module singleton state (mock data) is reset between tests; filters live in the route URL
beforeEach(() => mockTodos.reset());
afterEach(() => {
  signOutStarted();
  cleanup();
});
