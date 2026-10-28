import type { AppLocale } from '@bt/shared';

import { authClient } from './auth';
import { sessionFetched, signOutStarted, toSession, writeMockLocale } from './session';

// Condition is inlined: vite strips the mock branch from the prod bundle only on a literal comparison
const useMocks = import.meta.env.VITE_USE_MOCKS === '1';

/** Dictionary keys for account action outcomes: texts live only in i18n dictionaries */
export type AccountMessageKey =
  'auth.account.email_updated' | 'auth.account.password_updated' | 'auth.account.sessions_revoked';

export type AccountErrorKey =
  | 'auth.account.demo_unavailable'
  | 'auth.account.email_failed'
  | 'auth.account.password_failed'
  | 'auth.account.revoke_failed'
  | 'auth.account.delete_failed';

/** Account action result: success with a message key or error with a key for the UI */
export type AccountResult =
  { ok: true; message?: AccountMessageKey } | { ok: false; error: AccountErrorKey };

const unavailableInDemo: AccountResult = { ok: false, error: 'auth.account.demo_unavailable' };

/** Re-reads the session: after an email change the server has already set a cookie for the new user */
async function refreshSession(): Promise<void> {
  const { data, error } = await authClient.getSession();
  sessionFetched(error ? null : toSession(data?.user));
}

/** Email change: better-auth does it via change-email (update-user forbids email); without SMTP it applies immediately */
export async function changeAccountEmail(newEmail: string): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.changeEmail({ newEmail, callbackURL: '/' });
  if (error) return { ok: false, error: 'auth.account.email_failed' };
  await refreshSession();
  return { ok: true, message: 'auth.account.email_updated' };
}

/** Password change: current password required; a successful change keeps the current session */
export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.changePassword({ currentPassword, newPassword });
  if (error) return { ok: false, error: 'auth.account.password_failed' };
  return { ok: true, message: 'auth.account.password_updated' };
}

/** Revokes all user sessions: this device signs out too, the store is cleared */
export async function signOutEverywhere(): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.revokeSessions();
  if (error) return { ok: false, error: 'auth.account.revoke_failed' };
  signOutStarted();
  return { ok: true, message: 'auth.account.sessions_revoked' };
}

/** Deletes the account (password required), then clears the local session; the page handles the redirect */
export async function deleteAccount(password: string): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.deleteUser({ password });
  if (error) return { ok: false, error: 'auth.account.delete_failed' };
  signOutStarted();
  return { ok: true };
}

/** Saves the chosen language to the profile; in mocks the "DB" is DEMO_USER and localStorage. Failure is not critical: UI and local copy keep the chosen language */
export async function updateAccountLocale(locale: AppLocale): Promise<void> {
  if (useMocks) {
    const { DEMO_USER } = await import('@bt/api/testing');
    DEMO_USER.locale = locale;
    writeMockLocale(locale);
    return;
  }
  await authClient.updateUser({ locale });
}
