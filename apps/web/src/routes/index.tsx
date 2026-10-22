import { createFileRoute } from '@tanstack/react-router';

import { TodoPage } from '../pages/todo-page';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Beautiful Todo' }] }),
  component: TodoPage,
});
