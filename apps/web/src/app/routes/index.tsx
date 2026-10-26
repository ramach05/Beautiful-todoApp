import { createFileRoute, redirect } from '@tanstack/react-router';

import { $session, sessionReady } from '@/features/auth';
import { parseTodoSearch } from '@/features/todo-filter';
import { TodoPage } from '@/pages/todo-page';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Beautiful Todo' }] }),
  // Фильтр и поиск — часть адреса: схему валидации держит фича фильтров (ADR-002)
  validateSearch: parseTodoSearch,
  beforeLoad: async () => {
    await sessionReady;
    if (!$session.getState()) {
      throw redirect({ to: '/login' });
    }
  },
  component: TodoPage,
});
