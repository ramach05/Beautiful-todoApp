import { useNavigate } from '@tanstack/react-router';
import { useUnit } from 'effector-react';
import { useState } from 'react';

import {
  type AccountResult,
  $session,
  changeAccountEmail,
  changeAccountPassword,
  deleteAccount,
  signOutEverywhere,
} from '@/features/auth';
import { Spinner } from '@/shared/ui/spinner';

const inputClass =
  'focus-ring w-full rounded-[10px] bg-card-strong px-3 py-2 text-lg ring-1 ring-ring-soft ' +
  'placeholder:text-gray-400 focus:ring-white focus:outline-none';
const buttonClass =
  'focus-ring inline-flex items-center gap-2 rounded-[10px] bg-card-strong px-4 py-2 text-lg ' +
  'ring-1 ring-accent-soft transition-colors hover:bg-ring-soft disabled:opacity-40';
const dangerButtonClass =
  'focus-ring inline-flex items-center gap-2 rounded-[10px] bg-card-strong px-4 py-2 text-lg ' +
  'ring-1 ring-accent transition-colors hover:bg-accent/20 disabled:opacity-40';

type ActionKey = 'email' | 'password' | 'revoke' | 'delete';
type Feedback = { tone: 'ok' | 'err'; text: string };

/**
 * Настройки аккаунта: смена email/пароля, выход на всех устройствах, удаление аккаунта.
 * В демо-режиме действия честно возвращают недоступность вместо падения.
 */
export function SettingsPage() {
  const session = useUnit($session);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [password, setPassword] = useState('');

  const [pending, setPending] = useState<ActionKey | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function run(key: ActionKey, action: () => Promise<AccountResult>, leaveApp = false) {
    setPending(key);
    setFeedback(null);
    const result = await action();
    setPending(null);
    if (result.ok) {
      setFeedback({ tone: 'ok', text: result.message ?? 'Done.' });
      if (leaveApp) await navigate({ to: '/login' });
    } else {
      setFeedback({ tone: 'err', text: result.error });
    }
  }

  const busy = (key: ActionKey) => pending === key;
  const disabled = pending !== null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h2 className="text-3xl">Settings</h2>

      <p className="text-lg text-gray-300">
        Signed in as <span className="text-white">{session?.user.email ?? '—'}</span>
      </p>

      {feedback && (
        <p
          role={feedback.tone === 'err' ? 'alert' : 'status'}
          className={
            feedback.tone === 'err'
              ? 'rounded-[10px] bg-card-strong px-3 py-2 text-accent ring-1 ring-ring-soft'
              : 'rounded-[10px] bg-card-strong px-3 py-2 text-gray-300 ring-1 ring-ring-soft'
          }
        >
          {feedback.text}
        </p>
      )}

      <section className="flex flex-col gap-2" aria-labelledby="settings-email">
        <h3 id="settings-email" className="text-xl">
          Change email
        </h3>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run('email', () => changeAccountEmail(email));
          }}
        >
          <input
            type="email"
            className={inputClass}
            placeholder="New email"
            aria-label="New email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            type="submit"
            className={buttonClass}
            disabled={disabled}
            aria-busy={busy('email')}
          >
            {busy('email') && <Spinner />}
            Update email
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="settings-password">
        <h3 id="settings-password" className="text-xl">
          Change password
        </h3>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run('password', () => changeAccountPassword(currentPassword, newPassword));
          }}
        >
          <input
            type="password"
            className={inputClass}
            placeholder="Current password"
            aria-label="Current password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <input
            type="password"
            className={inputClass}
            placeholder="New password"
            aria-label="New password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <button
            type="submit"
            className={buttonClass}
            disabled={disabled}
            aria-busy={busy('password')}
          >
            {busy('password') && <Spinner />}
            Change password
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="settings-sessions">
        <h3 id="settings-sessions" className="text-xl">
          Sessions
        </h3>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled}
          aria-busy={busy('revoke')}
          onClick={() => void run('revoke', signOutEverywhere, true)}
        >
          {busy('revoke') && <Spinner />}
          Sign out everywhere
        </button>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="settings-delete">
        <h3 id="settings-delete" className="text-xl">
          Delete account
        </h3>
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run('delete', () => deleteAccount(password), true);
          }}
        >
          <input
            type="password"
            className={inputClass}
            placeholder="Confirm with your password"
            aria-label="Confirm password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="submit"
            className={dangerButtonClass}
            disabled={disabled}
            aria-busy={busy('delete')}
          >
            {busy('delete') && <Spinner />}
            Delete account
          </button>
        </form>
      </section>
    </div>
  );
}
