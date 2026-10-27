import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { i18n } from '@/shared/i18n';
import { RegisterPage } from '@/pages/register-page';

function RegisterComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <RegisterPage
      onSuccess={() => void navigate({ to: '/' })}
      footer={
        <Link className="nav-link focus-ring rounded" to="/login">
          {t('auth.have_account')}
        </Link>
      }
    />
  );
}

export const Route = createFileRoute('/register')({
  head: () => ({ meta: [{ title: i18n.t('doc_title.sign_up') }] }),
  component: RegisterComponent,
});
