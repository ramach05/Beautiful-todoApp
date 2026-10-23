import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import { signOutStarted } from '@/features/auth';
import { filtersReset } from '@/features/todo-filter';

import { mockTodos } from '../mocks/mock-client';

// Модульные singleton-состояния (данные мока, сторы Effector) сбрасываются между тестами
beforeEach(() => mockTodos.reset());
afterEach(() => {
  filtersReset();
  signOutStarted();
  cleanup();
});
