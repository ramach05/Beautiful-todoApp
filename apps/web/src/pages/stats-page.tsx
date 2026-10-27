import { Skeleton, SkeletonBlock } from '@/shared/ui/skeleton';
import { Button } from '@/shared/ui/button';
import { StatsChart, computeStats } from '@/features/todo-stats';
import { useTodos } from '@/entities/todo';

const cardClass = 'lift rounded-[10px] bg-card-strong px-3 py-4 text-center ring-1 ring-ring-soft';

/** Карточка одного агрегата */
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={cardClass}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-base text-gray-300">{label}</div>
    </div>
  );
}

/** Каркас контента статистики: четыре карточки и область графика */
function StatsContentSkeleton() {
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

/**
 * Страница статистики: только производные величины из useTodos (Query),
 * агрегация вынесена в чистую функцию computeStats.
 */
export function StatsPage() {
  const todosQuery = useTodos();

  if (todosQuery.isPending) {
    return <StatsContentSkeleton />;
  }

  if (todosQuery.isError) {
    return (
      <div className="py-10 text-center" role="alert">
        <p className="text-xl text-accent">Failed to load stats</p>
        <Button variant="ghost" className="mt-3" onClick={() => void todosQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const stats = computeStats(todosQuery.data ?? []);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-3xl">Statistics</h2>

      <section
        className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-4"
        aria-label="Aggregates"
      >
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Important" value={stats.important} />
      </section>

      <section
        className="min-w-0 rounded-[10px] bg-card-strong p-3 ring-1 ring-ring-soft xs:p-4"
        aria-labelledby="stats-chart-heading"
      >
        <h3 id="stats-chart-heading" className="mb-3 text-xl">
          Completed per day (last 7 days)
        </h3>
        <StatsChart data={stats.daily} />
      </section>

      <section
        className="min-w-0 rounded-[10px] bg-card-strong p-3 ring-1 ring-ring-soft xs:p-4"
        aria-labelledby="stats-oldest-heading"
      >
        <h3 id="stats-oldest-heading" className="mb-1 text-xl">
          Oldest unfinished
        </h3>
        <p className="break-words text-lg text-gray-300">
          {stats.oldestIncomplete?.title ?? 'No unfinished todos'}
        </p>
      </section>
    </div>
  );
}
