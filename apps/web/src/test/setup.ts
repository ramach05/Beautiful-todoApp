import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { filtersReset } from '../features/todo-filter/model/filters';
import { db } from '../mocks/db';
import { server } from './server';

// MSW-сервер поднимается один раз на прогон; модульные singleton-состояния сбрасываются между тестами
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => db.reset());
afterEach(() => {
  server.resetHandlers();
  filtersReset();
  cleanup();
});
afterAll(() => server.close());
