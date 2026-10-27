import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';

import { requireSession } from '../guards';
import { todoKeys } from '@/entities/todo';
import { StatsPageSuspense } from '@/pages/stats-skeleton';
import { api, queryClient } from '@/shared/api';

// Ленивый чанк страницы: отдельно грузится только код самой статистики
const StatsPage = lazy(() => import('@/pages/stats-page').then((m) => ({ default: m.StatsPage })));

export const Route = createFileRoute('/stats')({
  head: () => ({ meta: [{ title: 'Beautiful Todo — Stats' }] }),
  beforeLoad: requireSession,
  component: () => (
    <StatsPageSuspense>
      <StatsPage />
    </StatsPageSuspense>
  ),
  // Предварительная загрузка данных до рендера: ensureQueryData отдает кэш если свежий, иначе качает
  loader: async () => {
    await queryClient.ensureQueryData({ queryKey: todoKeys.all, queryFn: () => api.todos.list() });
  },
});
