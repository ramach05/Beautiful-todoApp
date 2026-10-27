import { useEffect, useRef, useState } from 'react';

import type { CSSProperties } from 'react';

import { cn, startPointerAmbient } from '@/shared/lib';
import { cityBg, cityBgLqip, cityBgSources } from '@/shared/ui/assets';

/** Плавное проявление фона; по запросу системы сокращений анимаций — без перехода */
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

/** Теплые и редкие холодные оттенки окон на ночном фото города */
const WINDOW_COLORS = ['#ffd9a0', '#ffe9c9', '#fff6e3', '#ffcf8a', '#ffbe7a', '#cfe4ff'] as const;

/** Детерминированный PRNG: расклад окон одинаков на всех клиентах и между рендерами */
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
 * Расклад мерцающих «окошек»: нижние ~70% кадра (город), плотнее к нижнему краю.
 * Позиции в процентах слоя фона — совпадения с конкретными окнами фото не требуется,
 * на фоне сотен реальных огней дополнительные искры читаются как живая городская ночь.
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

/** Мерцающие окна города: только opacity-анимации, слой движется вместе с параллаксом */
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

/** Fixed-слой фона: его box равен вьюпорту, поэтому рост списка задач не меняет масштаб картинки */
export function CityBackground() {
  const [loaded, setLoaded] = useState(false);
  const layerRef = useRef<HTMLDivElement | null>(null);

  // Параллакс слоя (картинка + окна + дыхание) живет одним rAF-циклом с прямыми записями в DOM
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    return startPointerAmbient(layer);
  }, []);

  // Картинка после preload уже в кэше и load на нее не приходит — смотрим на complete
  function trackImage(img: HTMLImageElement | null) {
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }

  return (
    <div aria-hidden className="fixed inset-0 overflow-hidden bg-canvas">
      {/* LQIP растянут под вьюпорт; scale прячет полупрозрачные края, которые оставляет blur */}
      <div
        className={cn(
          'absolute inset-0 scale-110 bg-cover bg-center blur-2xl',
          fade,
          loaded && 'opacity-0',
        )}
        style={{ backgroundImage: `url("${cityBgLqip}")` }}
      />
      {/* Общий transform-слой: scale-110 через CSS-свойство scale, translate пишет JS в transform */}
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
      {/* Пятна света над фоном под контентом: координаты JS пишет на корень документа */}
      <div aria-hidden className="spotlight pointer-events-none absolute inset-0" />
      <div aria-hidden className="spotlight-hot pointer-events-none absolute inset-0" />
    </div>
  );
}
