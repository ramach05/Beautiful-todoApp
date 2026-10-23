import { createFileRoute, redirect } from '@tanstack/react-router';

import { $session, sessionReady } from '@/features/auth';
import { TodoPage } from '@/pages/todo-page';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Beautiful Todo' }] }),
  beforeLoad: async () => {
    await sessionReady;
    if (!$session.getState()) {
      throw redirect({ to: '/login' });
    }
  },
  component: TodoPage,
});
