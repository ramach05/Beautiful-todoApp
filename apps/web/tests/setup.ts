import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import { signOutStarted } from '@/features/auth';

import { mockTodos } from '../mocks/mock-client';

// Модульные singleton-состояния (данные мока) сбрасываются между тестами; фильтры живут в URL роута
beforeEach(() => mockTodos.reset());
afterEach(() => {
  signOutStarted();
  cleanup();
});
