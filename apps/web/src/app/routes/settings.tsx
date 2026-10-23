import { createFileRoute, redirect } from '@tanstack/react-router';

import { $session, sessionReady } from '@/features/auth';
import { SettingsPage } from '@/pages/settings-page';

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [{ title: 'Beautiful Todo — Settings' }] }),
  beforeLoad: async () => {
    await sessionReady;
    if (!$session.getState()) {
      throw redirect({ to: '/login' });
    }
  },
  component: SettingsPage,
});
