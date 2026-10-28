import { createFileRoute } from '@tanstack/react-router';
import { lazy } from 'react';

import { requireSession } from '@/app/guards';
import { todoKeys } from '@/entities/todo';
import { StatsPageSuspense } from '@/pages/stats-skeleton';
import { api, queryClient } from '@/shared/api';
import { i18n } from '@/shared/i18n';

// Lazy page chunk: only the stats code itself is loaded separately
const StatsPage = lazy(() => import('@/pages/stats-page').then((m) => ({ default: m.StatsPage })));

export const Route = createFileRoute('/stats')({
  head: () => ({ meta: [{ title: i18n.t('doc_title.stats') }] }),
  beforeLoad: requireSession,
  component: () => (
    <StatsPageSuspense>
      <StatsPage />
    </StatsPageSuspense>
  ),
  // Prefetch data before render: ensureQueryData returns cache when fresh, otherwise downloads
  loader: async () => {
    await queryClient.ensureQueryData({ queryKey: todoKeys.all, queryFn: () => api.todos.list() });
  },
});
