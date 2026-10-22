import { useNavigate } from '@tanstack/react-router';
import { useUnit } from 'effector-react';

import { $session, signOut } from '../../features/auth/model/session';

export function Header() {
  const session = useUnit($session);
  const navigate = useNavigate();

  return (
    <header className="relative pt-6 text-center">
      <h1 className="text-5xl font-bold tracking-wide">My Todo List</h1>
      {session && (
        <div className="absolute right-4 top-6 flex items-center gap-2 text-sm">
          <span className="text-gray-300">{session.user.email}</span>
          <button
            type="button"
            className="rounded-md px-2 py-1 ring-1 ring-ring-soft transition-colors hover:bg-ring-soft"
            onClick={() => void signOut().then(() => navigate({ to: '/login' }))}
          >
            Выйти
          </button>
        </div>
      )}
    </header>
  );
}
