import { Suspense, type ReactNode } from 'react';

import { Skeleton, SkeletonBlock } from '@/shared/ui/skeleton';

const cardClass = 'lift rounded-[10px] bg-card-strong px-3 py-4 text-center ring-1 ring-ring-soft';

/** Каркас контента статистики: четыре карточки и область графика */
export function StatsContentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <SkeletonBlock className="h-8 w-40" />
      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={cardClass}>
            <SkeletonBlock className="mx-auto h-7 w-12" />
            <SkeletonBlock className="mx-auto mt-2 h-4 w-16" />
          </div>
        ))}
      </div>
      <Skeleton
        label="Loading chart"
        className="rounded-[10px] bg-card-strong p-4 ring-1 ring-ring-soft"
      >
        <SkeletonBlock className="h-5 w-52" />
        <SkeletonBlock className="mt-3 h-[140px] w-full" />
      </Skeleton>
    </div>
  );
}

/** Обертка lazy-чанка статистики: на время загрузки кода показывает каркас, а не пустой экран */
export function StatsPageSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<StatsContentSkeleton />}>{children}</Suspense>;
}
