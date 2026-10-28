import { redirect } from '@tanstack/react-router';

import { $session, sessionReady } from '@/features/auth';

/** Guard for protected routes: waits for the session to resolve and sends a guest to the login page */
export async function requireSession(): Promise<void> {
  await sessionReady;
  if (!$session.getState()) {
    throw redirect({ to: '/login' });
  }
}
