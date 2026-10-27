import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { i18n } from '@/shared/i18n';
import { LoginPage } from '@/pages/login-page';

function LoginComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <LoginPage
      onSuccess={() => void navigate({ to: '/' })}
      footer={
        <Link className="nav-link focus-ring rounded" to="/register">
          {t('auth.no_account')}
        </Link>
      }
    />
  );
}

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: i18n.t('doc_title.sign_in') }] }),
  component: LoginComponent,
});
