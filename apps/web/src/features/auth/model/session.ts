import { createEvent, createStore } from 'effector';
import { DEFAULT_LOCALE, parseLocale, type AppLocale } from '@bt/shared';

import { authClient } from './auth';

// Условие инлайнится: vite гасит мок-ветки из прод-бандла только при литеральном сравнении
const useMocks = import.meta.env.VITE_USE_MOCKS === '1';

export interface AppSession {
  user: { id: string; email: string; locale: AppLocale };
}

/** Ключи словаря ошибок auth: тексты живут в словарях i18n, модель оперирует ключами */
export type AuthErrorKey =
  | 'auth.errors.invalid_email'
  | 'auth.errors.invalid_password'
  | 'auth.errors.invalid_credentials'
  | 'auth.errors.email_not_verified'
  | 'auth.errors.email_exists'
  | 'auth.errors.too_many'
  | 'auth.errors.generic';

/** Сессия пользователя — UI-состояние (Effector); серверные данные остаются в Query */
export const $session = createStore<AppSession | null>(null);

export const sessionFetched = createEvent<AppSession | null>();
export const signOutStarted = createEvent<void>();

$session.on(sessionFetched, (_, session) => session);
$session.reset(signOutStarted);

const MOCK_LOCALE_KEY = 'bt-demo-locale';

/** Язык demo-пользователя в localStorage: «БД» мока переживает перезагрузку, как настоящая */
export function readMockLocale(): AppLocale | null {
  try {
    return parseLocale(window.localStorage.getItem(MOCK_LOCALE_KEY));
  } catch {
    // Приватный режим: язык мока живет до перезагрузки
    return null;
  }
}

export function writeMockLocale(locale: AppLocale): void {
  try {
    window.localStorage.setItem(MOCK_LOCALE_KEY, locale);
  } catch {
    // Приватный режим: сохранение недоступно, демо-язык сбросится на перезагрузке
  }
}

async function mockSession(): Promise<AppSession> {
  const { DEMO_USER } = await import('@bt/api/testing');
  const locale = readMockLocale() ?? DEMO_USER.locale;
  return { user: { id: DEMO_USER.id, email: DEMO_USER.email, locale } };
}

/** Граница better-auth: locale приходит строкой, в контракт попадает только валидная AppLocale */
export function toSession(
  user:
    | {
        id: string;
        email: string;
        locale?: string | null;
      }
    | undefined,
): AppSession | null {
  return user
    ? {
        user: {
          id: user.id,
          email: user.email,
          locale: parseLocale(user.locale) ?? DEFAULT_LOCALE,
        },
      }
    : null;
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

/** Известные коды better-auth → ключи словаря: INVALID_EMAIL_OR_PASSWORD не подсвечивает, какое поле неверно */
const AUTH_ERROR_KEYS: Record<string, AuthErrorKey> = {
  INVALID_EMAIL: 'auth.errors.invalid_email',
  INVALID_PASSWORD: 'auth.errors.invalid_password',
  INVALID_EMAIL_OR_PASSWORD: 'auth.errors.invalid_credentials',
  USER_EMAIL_NOT_FOUND: 'auth.errors.invalid_credentials',
  EMAIL_NOT_VERIFIED: 'auth.errors.email_not_verified',
  USER_ALREADY_EXISTS: 'auth.errors.email_exists',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'auth.errors.email_exists',
};

/** Форма ошибки better-auth-клиента, достаточная для маппинга: код из тела и HTTP-статус */
interface AuthClientError {
  code?: string | null;
  status?: number;
}

/** Единственная точка перевода сбоя auth: ключ словаря без внутренних сообщений сервера */
function describeAuthError(error: AuthClientError): AuthErrorKey {
  // 429 приходит и от rate-limit Fastify без кода better-auth, поэтому проверяем статус
  if (error.status === 429) {
    return 'auth.errors.too_many';
  }
  return (error.code ? AUTH_ERROR_KEYS[error.code] : undefined) ?? 'auth.errors.generic';
}

/** Вход по email+password; возвращает ключ ошибки или null при успехе */
export async function signIn(email: string, password: string): Promise<AuthErrorKey | null> {
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

/** Регистрация: name берется из email; текущий язык UI уходит в профиль нового пользователя */
export async function signUp(
  email: string,
  password: string,
  locale: AppLocale,
): Promise<AuthErrorKey | null> {
  if (useMocks) {
    sessionFetched(await mockSession());
    return null;
  }
  const { data, error } = await authClient.signUp.email({
    email,
    password,
    name: email.split('@')[0] ?? email,
    locale,
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
