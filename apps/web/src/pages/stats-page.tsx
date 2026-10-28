import { Button } from '@/shared/ui/button';
import { DEFAULT_LOCALE, parseLocale } from '@bt/shared';
import { useTranslation } from 'react-i18next';

import { StatsChart, computeStats } from '@/features/todo-stats';
import { useTodos } from '@/entities/todo';

import { StatsContentSkeleton } from './stats-skeleton';

const cardClass = 'lift rounded-[10px] bg-card-strong px-3 py-4 text-center ring-1 ring-ring-soft';

/** Card for one aggregate */
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={cardClass}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-base text-gray-300">{label}</div>
    </div>
  );
}

/**
 * Stats page: only derived values from useTodos (Query),
 * aggregation is extracted into the pure function computeStats.
 */
export function StatsPage() {
  const { t, i18n } = useTranslation();
  const todosQuery = useTodos();

  if (todosQuery.isPending) {
    return <StatsContentSkeleton />;
  }

  if (todosQuery.isError) {
    return (
      <div className="py-10 text-center" role="alert">
        <p className="text-xl text-accent">{t('stats.load_failed')}</p>
        <Button variant="ghost" className="mt-3" onClick={() => void todosQuery.refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const stats = computeStats(
    todosQuery.data ?? [],
    new Date(),
    parseLocale(i18n.language) ?? DEFAULT_LOCALE,
  );

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-3xl">{t('stats.title')}</h2>

      <section
        className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-4"
        aria-label={t('stats.aggregates_aria')}
      >
        <StatCard label={t('stats.total')} value={stats.total} />
        <StatCard label={t('stats.active')} value={stats.active} />
        <StatCard label={t('stats.completed')} value={stats.completed} />
        <StatCard label={t('stats.important')} value={stats.important} />
      </section>

      <section
        className="min-w-0 rounded-[10px] bg-card-strong p-3 ring-1 ring-ring-soft xs:p-4"
        aria-labelledby="stats-chart-heading"
      >
        <h3 id="stats-chart-heading" className="mb-3 text-xl">
          {t('stats.chart_heading')}
        </h3>
        <StatsChart data={stats.daily} />
      </section>

      <section
        className="min-w-0 rounded-[10px] bg-card-strong p-3 ring-1 ring-ring-soft xs:p-4"
        aria-labelledby="stats-oldest-heading"
      >
        <h3 id="stats-oldest-heading" className="mb-1 text-xl">
          {t('stats.oldest_heading')}
        </h3>
        <p className="break-words text-lg text-gray-300">
          {stats.oldestIncomplete?.title ?? t('stats.oldest_empty')}
        </p>
      </section>
    </div>
  );
}
