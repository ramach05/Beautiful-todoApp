import type { ReactNode } from 'react';

import { cityBg } from '@/shared/ui/assets';
import { Footer } from './footer';
import { Header } from './header';

/** Каркас страницы: фон-фотография, «картонная» карточка контента, шапка и подвал */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-dvh flex-col bg-cover bg-center p-3 sm:p-6"
      style={{ backgroundImage: `url(${cityBg})` }}
    >
      <div className="mx-auto flex w-full max-w-3xl grow flex-col rounded-[20px] bg-canvas/90 px-4 shadow-[0_0_0_1px_var(--color-ring-soft)]">
        <Header />
        <main className="grow py-5">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
