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
  const { DEMO_USER } = await import('@bt/api/testing');
  return { user: { id: DEMO_USER.id, email: DEMO_USER.email } };
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
  try {
    const { data, error } = await authClient.getSession();
    sessionFetched(error ? null : toSession(data?.user));
  } catch {
    // Сбой сети/CORS недоступного api — это «нет сессии», а не зависший монтаж приложения
    sessionFetched(null);
  }
})();

/** Известные коды better-auth и свои тексты: INVALID_EMAIL_OR_PASSWORD не подсвечивает, какое поле неверно */
const AUTH_ERROR_TEXTS: Record<string, string> = {
  INVALID_EMAIL: 'Enter a valid email',
  INVALID_PASSWORD: 'Enter a password',
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
  USER_EMAIL_NOT_FOUND: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Email is not verified',
  USER_ALREADY_EXISTS: 'An account with this email already exists',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'An account with this email already exists',
};

const GENERIC_AUTH_ERROR = 'Something went wrong. Please try again';

/** Форма ошибки better-auth-клиента, достаточная для маппинга: код из тела и HTTP-статус */
interface AuthClientError {
  code?: string | null;
  status?: number;
}

/** Единственная точка перевода сбоя auth: без внутренних сообщений сервера и без подсказок про конкретное поле */
function describeAuthError(error: AuthClientError): string {
  // 429 приходит и от rate-limit Fastify без кода better-auth, поэтому проверяем статус
  if (error.status === 429) {
    return 'Too many attempts. Please try again in a minute';
  }
  return (error.code ? AUTH_ERROR_TEXTS[error.code] : undefined) ?? GENERIC_AUTH_ERROR;
}

/** Вход по email+password; возвращает текст ошибки или null при успехе */
export async function signIn(email: string, password: string): Promise<string | null> {
  if (useMocks) {
    sessionFetched(await mockSession());
    return null;
  }
  const { data, error } = await authClient.signIn.email({ email, password });
  if (error) {
    return describeAuthError(error);
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
    return describeAuthError(error);
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
