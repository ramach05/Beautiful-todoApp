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

// jsdom has no HTMLDialogElement.showModal/close: a minimal open/close shim for the Modal tests
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

// Module singleton state (mock data) is reset between tests; filters live in the route URL
beforeEach(() => mockTodos.reset());
afterEach(() => {
  signOutStarted();
  cleanup();
});
