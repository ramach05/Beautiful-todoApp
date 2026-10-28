import type { ReactNode } from 'react';

import { registerSpotTarget } from '@/shared/lib';

import { CityBackground } from './city-background';
import { Footer } from './footer';
import { Header } from './header';

/** Page frame: fixed background, "cardboard" content card, header and footer */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <CityBackground />
      <div className="relative z-10 flex min-h-dvh flex-col p-3 sm:p-6">
        <div className="relative mx-auto flex w-full max-w-3xl grow flex-col rounded-[20px] bg-canvas/90 px-4 shadow-[0_0_0_1px_var(--color-ring-soft)]">
          <Header />
          <main id="main-content" className="grow py-5">
            {children}
          </main>
          <Footer />
          {/* The ring is a separate leaf element: JS writes spot coordinates into it,
              so style recalculation does not touch the card contents */}
          <div aria-hidden ref={registerSpotTarget} className="edge-ring" />
        </div>
      </div>
    </>
  );
}
