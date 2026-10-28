import { createAuthClient } from 'better-auth/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';

const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? 'http://localhost:3001/api/auth';

/** better-auth client: email+password and session via httpOnly cookie; locale is a server additionalField */
export const authClient = createAuthClient({
  baseURL: AUTH_URL,
  fetchOptions: { credentials: 'include' },
  plugins: [inferAdditionalFields({ user: { locale: { type: 'string', required: false } } })],
});
