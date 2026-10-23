import { useNavigate } from '@tanstack/react-router';
import { useUnit } from 'effector-react';

import { $session, signOut } from '../../features/auth/model/session';

export function Header() {
  const session = useUnit($session);
  const navigate = useNavigate();

  return (
    <header className="pt-6">
      {session && (
        <div className="mb-2 flex min-w-0 items-center justify-end gap-2 text-sm">
          <span className="min-w-0 truncate text-gray-300" title={session.user.email}>
            {session.user.email}
          </span>
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1 ring-1 ring-ring-soft transition-colors hover:bg-ring-soft"
            onClick={() => void signOut().then(() => navigate({ to: '/login' }))}
          >
            Sign out
          </button>
        </div>
      )}
      <h1 className="text-center text-5xl font-bold tracking-wide">Beautiful Todo List</h1>
    </header>
  );
}
