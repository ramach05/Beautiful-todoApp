import { useEffect, useRef, useState } from 'react';

import type { CSSProperties } from 'react';

import { cn, registerSpotTarget, startPointerAmbient } from '@/shared/lib';
import { cityBg, cityBgLqip, cityBgSources } from '@/shared/ui/assets';

/** Smooth background fade-in; no transition when the system requests reduced motion */
const fade = 'transition-opacity duration-300 motion-reduce:transition-none';

interface WindowLight {
  left: number;
  top: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  peak: number;
}

/** Warm and rare cool window tints over a night city photo */
const WINDOW_COLORS = ['#ffd9a0', '#ffe9c9', '#fff6e3', '#ffcf8a', '#ffbe7a', '#cfe4ff'] as const;

/** Deterministic PRNG: the window layout is the same on all clients and between renders */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Layout of twinkling "windows": the lower ~70% of the frame (the city), denser toward the bottom edge.
 * Positions in percentages of the background layer — no need to match specific windows in the photo,
 * against hundreds of real lights the extra sparks read as a living city night.
 */
const WINDOW_LIGHTS: readonly WindowLight[] = (() => {
  const random = createRandom(0x5eed_2026);
  return Array.from({ length: 46 }, () => ({
    left: random() * 98,
    top: 28 + Math.pow(random(), 0.65) * 70,
    size: 2 + Math.round(random() * 2),
    color: WINDOW_COLORS[Math.floor(random() * WINDOW_COLORS.length)] as string,
    duration: 3 + random() * 6,
    delay: random() * 9,
    peak: 0.45 + random() * 0.5,
  }));
})();

/** Twinkling city windows: opacity animations only, the layer moves together with the parallax */
function CityWindows() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {WINDOW_LIGHTS.map((light, index) => (
        <span
          key={index}
          className="city-window"
          style={
            {
              left: `${light.left}%`,
              top: `${light.top}%`,
              width: `${light.size}px`,
              height: `${light.size}px`,
              background: light.color,
              animationDuration: `${light.duration.toFixed(2)}s`,
              animationDelay: `${light.delay.toFixed(2)}s`,
              '--peak': light.peak.toFixed(2),
            } satisfies CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Fixed background layer: its box equals the viewport, so a growing todo list does not scale the image */
export function CityBackground() {
  const [loaded, setLoaded] = useState(false);
  const layerRef = useRef<HTMLDivElement | null>(null);

  // The layer parallax (image + windows + breathing) lives in one rAF loop with direct DOM writes
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    return startPointerAmbient(layer);
  }, []);

  // The image is already in cache after preload and never fires load — check complete instead
  function trackImage(img: HTMLImageElement | null) {
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }

  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden bg-canvas">
      {/* LQIP stretched to the viewport; scale hides the translucent edges left by the blur */}
      <div
        className={cn(
          'absolute inset-0 scale-110 bg-cover bg-center blur-2xl',
          fade,
          loaded && 'opacity-0',
        )}
        style={{ backgroundImage: `url("${cityBgLqip}")` }}
      />
      {/* Shared transform layer: scale-110 via the CSS scale property, translate is written to transform by JS */}
      <div ref={layerRef} className="absolute inset-0 scale-110 will-change-transform">
        <picture className="absolute inset-0 block">
          {cityBgSources.map((source) => (
            <source key={source.type} type={source.type} srcSet={source.srcSet} sizes="100vw" />
          ))}
          <img
            ref={trackImage}
            src={cityBg}
            alt=""
            decoding="async"
            fetchPriority="high"
            onLoad={() => setLoaded(true)}
            className={cn('size-full object-cover', fade, !loaded && 'opacity-0')}
          />
        </picture>
        <div className="city-breathe pointer-events-none absolute inset-0" />
        <CityWindows />
      </div>
      {/* Light spots above the background under the content: JS writes coordinates into the layers themselves */}
      <div
        aria-hidden
        ref={registerSpotTarget}
        className="spotlight pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        ref={registerSpotTarget}
        className="spotlight-hot pointer-events-none absolute inset-0"
      />
    </div>
  );
}
