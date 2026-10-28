import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import { signOutStarted } from '@/features/auth';
import '@/shared/i18n';
import { mockTodos } from '@/shared/mocks';

// jsdom не реализует ResizeObserver, а dnd-kit наблюдает им размеры строк списка
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (globalThis.ResizeObserver === undefined) {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom не реализует matchMedia; предпочтения анимаций в тестах — «без ограничений»
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

// Модульные singleton-состояния (данные мока) сбрасываются между тестами; фильтры живут в URL роута
beforeEach(() => mockTodos.reset());
afterEach(() => {
  signOutStarted();
  cleanup();
});
