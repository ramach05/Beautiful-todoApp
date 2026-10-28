import { createEvent, createStore } from 'effector';
import { DEFAULT_LOCALE, parseLocale, type AppLocale } from '@bt/shared';

import { authClient } from './auth';

// Condition is inlined: vite strips the mock branches from the prod bundle only on a literal comparison
const useMocks = import.meta.env.VITE_USE_MOCKS === '1';

export interface AppSession {
  user: { id: string; email: string; locale: AppLocale };
}

/** Auth error dictionary keys: texts live in i18n dictionaries, the model works with keys */
export type AuthErrorKey =
  | 'auth.errors.invalid_email'
  | 'auth.errors.invalid_password'
  | 'auth.errors.invalid_credentials'
  | 'auth.errors.email_not_verified'
  | 'auth.errors.email_exists'
  | 'auth.errors.too_many'
  | 'auth.errors.generic';

/** User session is UI state (Effector); server data stays in Query */
export const $session = createStore<AppSession | null>(null);

export const sessionFetched = createEvent<AppSession | null>();
export const signOutStarted = createEvent<void>();

$session.on(sessionFetched, (_, session) => session);
$session.reset(signOutStarted);

const MOCK_LOCALE_KEY = 'bt-demo-locale';

/** Demo user language in localStorage: the mock "DB" survives a reload like a real one */
export function readMockLocale(): AppLocale | null {
  try {
    return parseLocale(window.localStorage.getItem(MOCK_LOCALE_KEY));
  } catch {
    // Private mode: mock language lives until reload
    return null;
  }
}

export function writeMockLocale(locale: AppLocale): void {
  try {
    window.localStorage.setItem(MOCK_LOCALE_KEY, locale);
  } catch {
    // Private mode: saving unavailable, demo language resets on reload
  }
}

async function mockSession(): Promise<AppSession> {
  const { DEMO_USER } = await import('@bt/api/testing');
  const locale = readMockLocale() ?? DEMO_USER.locale;
  return { user: { id: DEMO_USER.id, email: DEMO_USER.email, locale } };
}

/** better-auth boundary: locale arrives as a string, only a valid AppLocale enters the contract */
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

/** Session init at startup: demo user in mocks, otherwise get-session from better-auth */
export const sessionReady: Promise<void> = (async () => {
  if (useMocks) {
    sessionFetched(await mockSession());
    return;
  }
  try {
    const { data, error } = await authClient.getSession();
    sessionFetched(error ? null : toSession(data?.user));
  } catch {
    // Network/CORS failure of an unreachable api means "no session", not a hung app mount
    sessionFetched(null);
  }
})();

/** Known better-auth codes → dictionary keys: INVALID_EMAIL_OR_PASSWORD does not highlight which field is wrong */
const AUTH_ERROR_KEYS: Record<string, AuthErrorKey> = {
  INVALID_EMAIL: 'auth.errors.invalid_email',
  INVALID_PASSWORD: 'auth.errors.invalid_password',
  INVALID_EMAIL_OR_PASSWORD: 'auth.errors.invalid_credentials',
  USER_EMAIL_NOT_FOUND: 'auth.errors.invalid_credentials',
  EMAIL_NOT_VERIFIED: 'auth.errors.email_not_verified',
  USER_ALREADY_EXISTS: 'auth.errors.email_exists',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'auth.errors.email_exists',
};

/** Shape of the better-auth client error sufficient for mapping: code from the body and HTTP status */
interface AuthClientError {
  code?: string | null;
  status?: number;
}

/** Single point of translating an auth failure: dictionary key without internal server messages */
function describeAuthError(error: AuthClientError): AuthErrorKey {
  // 429 also comes from Fastify rate-limit without a better-auth code, so check the status
  if (error.status === 429) {
    return 'auth.errors.too_many';
  }
  return (error.code ? AUTH_ERROR_KEYS[error.code] : undefined) ?? 'auth.errors.generic';
}

/** Signs in with email+password; returns an error key or null on success */
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

/** Sign up: name is taken from email; the current UI language goes into the new user's profile */
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
