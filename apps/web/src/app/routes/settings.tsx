import { createFileRoute } from '@tanstack/react-router';

import { SettingsPage } from '@/pages/settings-page';

import { requireSession } from '../guards';

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [{ title: 'Beautiful Todo — Settings' }] }),
  beforeLoad: requireSession,
  component: SettingsPage,
});
