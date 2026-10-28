import { createFileRoute } from '@tanstack/react-router';

import { parseTodoSearch } from '@/features/todo-filter';
import { TodoPage } from '@/pages/todo-page';
import { i18n } from '@/shared/i18n';

import { requireSession } from '@/app/guards';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: i18n.t('doc_title.app') }] }),
  // Фильтр и поиск — часть адреса: схему валидации держит фича фильтров (ADR-002)
  validateSearch: parseTodoSearch,
  beforeLoad: requireSession,
  component: TodoPage,
});
