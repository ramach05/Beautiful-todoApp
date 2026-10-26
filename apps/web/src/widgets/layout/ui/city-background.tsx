import { useEffect, useRef, useState } from 'react';

import { cn, startPointerAmbient } from '@/shared/lib';
import { cityBg, cityBgLqip, cityBgSources } from '@/shared/ui/assets';

/** Плавное проявление фона; по запросу системы сокращения анимаций — без перехода */
const fade = 'transition-opacity duration-300 motion-reduce:transition-none';

/** Fixed-слой фона: его box равен вьюпорту, поэтому рост списка задач не меняет масштаб картинки */
export function CityBackground() {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const spotRef = useRef<HTMLDivElement | null>(null);

  // Пятно света и параллакс живут одним rAF-циклом с прямыми записями в DOM
  useEffect(() => {
    const spot = spotRef.current;
    const img = imgRef.current;
    if (!spot || !img) return;
    return startPointerAmbient(spot, img);
  }, []);

  // Картинка после preload уже в кэше и load на нее не приходит — смотрим на complete
  function trackImage(img: HTMLImageElement | null) {
    imgRef.current = img;
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
      <picture>
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
          className={cn(
            'absolute inset-0 size-full scale-110 object-cover',
            fade,
            !loaded && 'opacity-0',
          )}
        />
      </picture>
      {/* Пятно света над фоном под контентом: позицию задает JS через --spot-x/--spot-y */}
      <div ref={spotRef} aria-hidden className="spotlight pointer-events-none absolute inset-0" />
    </div>
  );
}
