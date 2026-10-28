import { createFileRoute } from '@tanstack/react-router';

import { SettingsPage } from '@/pages/settings-page';
import { i18n } from '@/shared/i18n';

import { requireSession } from '@/app/guards';

export const Route = createFileRoute('/settings')({
  head: () => ({ meta: [{ title: i18n.t('doc_title.settings') }] }),
  beforeLoad: requireSession,
  component: SettingsPage,
});
