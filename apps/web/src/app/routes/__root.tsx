import { createRootRoute, Outlet } from '@tanstack/react-router';

import { PageShell } from '@/widgets/layout';

export const Route = createRootRoute({
  component: () => (
    <PageShell>
      <Outlet />
    </PageShell>
  ),
});
