import { createFileRoute, redirect } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

import { $session, sessionReady } from '@/features/auth';
import { todoKeys } from '@/entities/todo';
import { api, queryClient } from '@/shared/api';
import { Skeleton, SkeletonBlock } from '@/shared/ui/skeleton';

// Ленивый чанк страницы: отдельно грузится только код самой статистики
const StatsPage = lazy(() => import('@/pages/stats-page').then((m) => ({ default: m.StatsPage })));

/** Каркас на время загрузки lazy-чанка: заготовка карточек, а не пустой экран */
function ChunkFallback() {
  return (
    <Skeleton label="Loading statistics" className="flex flex-col gap-4">
      <SkeletonBlock className="h-8 w-40" />
      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-[10px] bg-card-strong px-3 py-4 ring-1 ring-ring-soft"
          >
            <SkeletonBlock className="mx-auto h-7 w-12" />
            <SkeletonBlock className="mx-auto mt-2 h-4 w-16" />
          </div>
        ))}
      </div>
    </Skeleton>
  );
}

function StatsRoute() {
  return (
    <Suspense fallback={<ChunkFallback />}>
      <StatsPage />
    </Suspense>
  );
}

export const Route = createFileRoute('/stats')({
  head: () => ({ meta: [{ title: 'Beautiful Todo — Stats' }] }),
  beforeLoad: async () => {
    await sessionReady;
    if (!$session.getState()) {
      throw redirect({ to: '/login' });
    }
  },
  // Предварительная загрузка данных до рендера: ensureQueryData отдает кэш если свежий, иначе качает
  loader: async () => {
    await queryClient.ensureQueryData({ queryKey: todoKeys.all, queryFn: () => api.todos.list() });
  },
  component: StatsRoute,
});
