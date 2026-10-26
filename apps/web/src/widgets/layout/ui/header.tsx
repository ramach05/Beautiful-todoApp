import { Link, useNavigate } from '@tanstack/react-router';
import { useUnit } from 'effector-react';

import { $session, signOut } from '@/features/auth';
import { cn } from '@/shared/lib';

const navItems = [
  { to: '/', label: 'Todo' },
  { to: '/stats', label: 'Stats' },
  { to: '/settings', label: 'Settings' },
] as const;

const navLinkClass =
  'focus-ring rounded-md px-2 py-1 text-gray-300 transition-colors hover:bg-ring-soft hover:text-white sm:px-3';

/** Обходной ярлык: виден только при фокусе с клавиатуры и уводит сразу к содержимому страницы */
function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        'focus-ring sr-only rounded-md bg-card-strong px-3 py-2 ring-1 ring-accent-soft',
        'focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50',
      )}
    >
      Skip to content
    </a>
  );
}

export function Header() {
  const session = useUnit($session);
  const navigate = useNavigate();

  return (
    <header className="relative pt-6">
      <SkipLink />
      {session && (
        <div className="mb-2 flex min-w-0 flex-wrap items-center justify-end gap-2 text-sm">
          <span className="min-w-0 truncate text-gray-300" title={session.user.email}>
            {session.user.email}
          </span>
          <button
            type="button"
            className="focus-ring shrink-0 rounded-md px-2 py-1 ring-1 ring-ring-soft transition-colors hover:bg-ring-soft"
            onClick={() => void signOut().then(() => navigate({ to: '/login' }))}
          >
            Sign out
          </button>
        </div>
      )}
      <h1 className="text-center text-4xl font-bold tracking-wide sm:text-5xl">
        Beautiful Todo List
      </h1>
      {session && (
        <nav aria-label="Primary" className="mt-4">
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
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
