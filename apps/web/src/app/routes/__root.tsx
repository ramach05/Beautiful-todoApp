import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

import { PageShell } from '@/widgets/layout';

/** Заглушка 404 для несуществующих маршрутов: ссылка возвращает на главную */
function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-6xl font-bold text-accent">404</p>
      <h2 className="text-2xl">Page not found</h2>
      <p className="text-gray-300">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="mt-2 rounded-[10px] bg-card-strong px-4 py-2 text-lg ring-1 ring-accent-soft transition-colors hover:bg-ring-soft"
      >
        Back to home
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
