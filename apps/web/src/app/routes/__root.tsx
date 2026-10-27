import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PageShell } from '@/widgets/layout';

/** Заглушка 404 для несуществующих маршрутов: ссылка возвращает на главную */
function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h2 className="flex flex-col gap-1">
        <span className="text-6xl font-bold text-accent">404</span>
        <span className="text-2xl">{t('not_found.title')}</span>
      </h2>
      <p className="text-gray-300">{t('not_found.body')}</p>
      <Link
        to="/"
        className="focus-ring lift sheen mt-2 rounded-[10px] bg-card-strong px-4 py-2 text-lg ring-1 ring-accent-soft hover:bg-ring-soft"
      >
        {t('not_found.back')}
      </Link>
    </div>
  );
}

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  component: () => (
    <PageShell>
      <Outlet />
    </PageShell>
  ),
});
