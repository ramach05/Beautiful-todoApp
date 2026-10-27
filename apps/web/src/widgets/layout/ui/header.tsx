import { Link, useNavigate } from '@tanstack/react-router';
import { useUnit } from 'effector-react';
import { useTranslation } from 'react-i18next';

import { $session, signOut } from '@/features/auth';
import { LocaleSwitcher } from '@/features/locale';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui/button';

const navItems = [
  { to: '/', labelKey: 'header.nav.todo' },
  { to: '/stats', labelKey: 'header.nav.stats' },
  { to: '/settings', labelKey: 'header.nav.settings' },
] as const;

const navLinkClass =
  'nav-link focus-ring rounded-md px-2 py-1 text-gray-300 transition-colors hover:bg-ring-soft hover:text-white sm:px-3';

/** Обходной ярлык: виден только при фокусе с клавиатуры и уводит сразу к содержимому страницы */
function SkipLink() {
  const { t } = useTranslation();
  return (
    <a
      href="#main-content"
      className={cn(
        'focus-ring sr-only rounded-md bg-card-strong px-3 py-2 ring-1 ring-accent-soft',
        'focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50',
      )}
    >
      {t('header.skip')}
    </a>
  );
}

export function Header() {
  const { t } = useTranslation();
  const session = useUnit($session);
  const navigate = useNavigate();

  return (
    <header className="relative pt-6">
      <SkipLink />
      <div className="mb-2 flex min-w-0 flex-wrap items-center justify-end gap-2 text-sm">
        {session && (
          <>
            <span className="min-w-0 truncate text-gray-300" title={session.user.email}>
              {session.user.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => void signOut().then(() => navigate({ to: '/login' }))}
            >
              {t('header.sign_out')}
            </Button>
          </>
        )}
        <LocaleSwitcher />
      </div>
      <h1 className="text-center text-4xl font-bold tracking-wide sm:text-5xl">
        {t('header.title')}
      </h1>
      {session && (
        <nav aria-label={t('header.nav_aria')} className="mt-4">
          <ul className="flex flex-wrap items-center justify-center gap-x-1 text-lg sm:text-xl">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={navLinkClass}
                  activeProps={{
                    'aria-current': 'page',
                    className: cn(navLinkClass, 'bg-ring-soft text-white'),
                  }}
                >
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
