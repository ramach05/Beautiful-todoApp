import type { AppLocale } from '@bt/shared';

import { authClient } from './auth';
import { sessionFetched, signOutStarted, toSession, writeMockLocale } from './session';

// Условие инлайнится: vite гасит мок-ветку из прод-бандла только при литеральном сравнении
const useMocks = import.meta.env.VITE_USE_MOCKS === '1';

/** Ключи словаря исходов действий с аккаунтом: тексты только в словарях i18n */
export type AccountMessageKey =
  'auth.account.email_updated' | 'auth.account.password_updated' | 'auth.account.sessions_revoked';

export type AccountErrorKey =
  | 'auth.account.demo_unavailable'
  | 'auth.account.email_failed'
  | 'auth.account.password_failed'
  | 'auth.account.revoke_failed'
  | 'auth.account.delete_failed';

/** Результат действия с аккаунтом: успех с ключом сообщения либо ошибка с ключом для UI */
export type AccountResult =
  { ok: true; message?: AccountMessageKey } | { ok: false; error: AccountErrorKey };

const unavailableInDemo: AccountResult = { ok: false, error: 'auth.account.demo_unavailable' };

/** Перечитывает сессию: после смены email сервер уже отдал cookie с новым пользователем */
async function refreshSession(): Promise<void> {
  const { data, error } = await authClient.getSession();
  sessionFetched(error ? null : toSession(data?.user));
}

/** Смена email: better-auth ведет ее через change-email (update-user email запрещает); без SMTP меняется сразу */
export async function changeAccountEmail(newEmail: string): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.changeEmail({ newEmail, callbackURL: '/' });
  if (error) return { ok: false, error: 'auth.account.email_failed' };
  await refreshSession();
  return { ok: true, message: 'auth.account.email_updated' };
}

/** Смена пароля: требуется текущий; успешная смена не рвет текущую сессию */
export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.changePassword({ currentPassword, newPassword });
  if (error) return { ok: false, error: 'auth.account.password_failed' };
  return { ok: true, message: 'auth.account.password_updated' };
}

/** Разрывает все сессии пользователя: это устройство тоже выходит, стор очищается */
export async function signOutEverywhere(): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.revokeSessions();
  if (error) return { ok: false, error: 'auth.account.revoke_failed' };
  signOutStarted();
  return { ok: true, message: 'auth.account.sessions_revoked' };
}

/** Удаляет аккаунт (нужен пароль), затем очищает локальную сессию; редирект делает страница */
export async function deleteAccount(password: string): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.deleteUser({ password });
  if (error) return { ok: false, error: 'auth.account.delete_failed' };
  signOutStarted();
  return { ok: true };
}

/** Сохраняет выбранный язык в профиль; в моке «БД» — DEMO_USER и localStorage. Сбой не критичен: UI и локальная копия держат выбранный язык */
export async function updateAccountLocale(locale: AppLocale): Promise<void> {
  if (useMocks) {
    const { DEMO_USER } = await import('@bt/api/testing');
    DEMO_USER.locale = locale;
    writeMockLocale(locale);
    return;
  }
  await authClient.updateUser({ locale });
}
