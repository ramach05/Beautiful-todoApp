import type { ReactNode } from 'react';

import { CityBackground } from './city-background';
import { Footer } from './footer';
import { Header } from './header';

/** Каркас страницы: fixed-фон, «картонная» карточка контента, шапка и подвал */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <CityBackground />
      <div className="relative z-10 flex min-h-dvh flex-col p-3 sm:p-6">
        <div className="mx-auto flex w-full max-w-3xl grow flex-col rounded-[20px] bg-canvas/90 px-4 shadow-[0_0_0_1px_var(--color-ring-soft)]">
          <Header />
          <main id="main-content" className="grow py-5">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
