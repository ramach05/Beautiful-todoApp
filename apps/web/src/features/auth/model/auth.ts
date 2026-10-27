import { createAuthClient } from 'better-auth/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';

const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:3001/api/auth';

/** Клиент better-auth: email+password и сессия через httpOnly cookie; locale — additionalField сервера */
export const authClient = createAuthClient({
  baseURL: AUTH_URL,
  fetchOptions: { credentials: 'include' },
  plugins: [inferAdditionalFields({ user: { locale: { type: 'string', required: false } } })],
});
