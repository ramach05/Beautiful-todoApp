import { redirect } from '@tanstack/react-router';

import { $session, sessionReady } from '@/features/auth';

/** Гвард защищенных маршрутов: ждет резолва сессии и уводит гостя на страницу входа */
export async function requireSession(): Promise<void> {
  await sessionReady;
  if (!$session.getState()) {
    throw redirect({ to: '/login' });
  }
}
