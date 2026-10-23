import { authClient } from './auth';
import { sessionFetched, signOutStarted } from './session';

// Условие инлайнится: vite гасит мок-ветку из прод-бандла только при литеральном сравнении
const useMocks = import.meta.env.VITE_USE_MOCKS === '1';

/** Результат действия с аккаунтом: успех с текстом либо ошибка с сообщением для UI */
export type AccountResult = { ok: true; message?: string } | { ok: false; error: string };

const unavailableInDemo: AccountResult = {
  ok: false,
  error: 'Account management is unavailable in demo mode.',
};

/** Перечитывает сессию: после смены email сервер уже отдал cookie с новым пользователем */
async function refreshSession(): Promise<void> {
  const { data, error } = await authClient.getSession();
  sessionFetched(
    !error && data?.user ? { user: { id: data.user.id, email: data.user.email } } : null,
  );
}

/** Смена email: better-auth ведет ее через change-email (update-user email запрещает); без SMTP меняется сразу */
export async function changeAccountEmail(newEmail: string): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.changeEmail({ newEmail, callbackURL: '/' });
  if (error) return { ok: false, error: error.message ?? 'Failed to update email' };
  await refreshSession();
  return { ok: true, message: 'Email updated.' };
}

/** Смена пароля: требуется текущий; успешная смена не рвет текущую сессию */
export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.changePassword({ currentPassword, newPassword });
  if (error) return { ok: false, error: error.message ?? 'Failed to change password' };
  return { ok: true, message: 'Password updated.' };
}

/** Разрывает все сессии пользователя: это устройство тоже выходит, стор очищается */
export async function signOutEverywhere(): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.revokeSessions();
  if (error) return { ok: false, error: error.message ?? 'Failed to revoke sessions' };
  signOutStarted();
  return { ok: true, message: 'Signed out on all devices.' };
}

/** Удаляет аккаунт (нужен пароль), затем очищает локальную сессию; редирект делает страница */
export async function deleteAccount(password: string): Promise<AccountResult> {
  if (useMocks) return unavailableInDemo;
  const { error } = await authClient.deleteUser({ password });
  if (error) return { ok: false, error: error.message ?? 'Failed to delete account' };
  signOutStarted();
  return { ok: true };
}
