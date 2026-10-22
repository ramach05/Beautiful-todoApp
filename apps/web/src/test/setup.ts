import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

import { signOutStarted } from '../features/auth/model/session';
import { mockTodos } from '../mocks/mock-client';
import { filtersReset } from '../features/todo-filter/model/filters';

// Модульные singleton-состояния (данные мока, сторы Effector) сбрасываются между тестами
beforeEach(() => mockTodos.reset());
afterEach(() => {
  filtersReset();
  signOutStarted();
  cleanup();
});
