import { createEvent, createStore } from 'effector';

import { authClient } from './auth';

// Условие инлайнится: vite гасит мок-ветки из прод-бандла только при литеральном сравнении
const useMocks = import.meta.env.VITE_USE_MOCKS === '1';

export interface AppSession {
  user: { id: string; email: string };
}

/** Сессия пользователя — UI-состояние (Effector); серверные данные остаются в Query */
export const $session = createStore<AppSession | null>(null);

export const sessionFetched = createEvent<AppSession | null>();
export const signOutStarted = createEvent<void>();

$session.on(sessionFetched, (_, session) => session);
$session.reset(signOutStarted);

async function mockSession(): Promise<AppSession> {
  const { DEMO_SESSION } = await import('../../../mocks/mock-client');
  return DEMO_SESSION;
}

function toSession(user: { id: string; email: string } | undefined): AppSession | null {
  return user ? { user: { id: user.id, email: user.email } } : null;
}

/** Инициализация сессии при старте: в моке — demo-пользователь, иначе get-session от better-auth */
export const sessionReady: Promise<void> = (async () => {
  if (useMocks) {
    sessionFetched(await mockSession());
    return;
  }
  const { data, error } = await authClient.getSession();
  sessionFetched(error ? null : toSession(data?.user));
})();

/** Вход по email+password; возвращает текст ошибки или null при успехе */
export async function signIn(email: string, password: string): Promise<string | null> {
  if (useMocks) {
    sessionFetched(await mockSession());
    return null;
  }
  const { data, error } = await authClient.signIn.email({ email, password });
  if (error) {
    return error.message ?? 'Sign-in failed';
  }
  sessionFetched(toSession(data?.user));
  return null;
}

/** Регистрация: name берется из email, чтобы не плодить лишнее поле в форме */
export async function signUp(email: string, password: string): Promise<string | null> {
  if (useMocks) {
    sessionFetched(await mockSession());
    return null;
  }
  const { data, error } = await authClient.signUp.email({
    email,
    password,
    name: email.split('@')[0] ?? email,
  });
  if (error) {
    return error.message ?? 'Sign-up failed';
  }
  sessionFetched(toSession(data?.user));
  return null;
}

export async function signOut(): Promise<void> {
  if (!useMocks) {
    await authClient.signOut();
  }
  signOutStarted();
}
