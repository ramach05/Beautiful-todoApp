/** Коэффициент lerpa: чем меньше, тем мягче догоняние курсора */
const LERP = 0.1;

/** Амплитуда параллакса фона в px: смещение в сторону, противоположную курсору */
const PARALLAX = 10;

const noop = () => {};

/**
 * Слежение за курсором для фоновых эффектов: пишет --spot-x/--spot-y на spotlight-слой
 * и translate3d на картинку фона через один rAF-цикл без ре-рендеров React.
 * На таче (pointer: coarse) и при prefers-reduced-motion не вешает слушателей вовсе.
 */
export function startPointerAmbient(spot: HTMLElement, img: HTMLElement): () => void {
  // Без matchMedia (jsdom) режимы не определить: эффекты выключены
  if (typeof window.matchMedia !== 'function') return noop;
  if (window.matchMedia('(pointer: coarse)').matches) return noop;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return noop;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let raf = 0;

  function tick() {
    const dx = targetX - x;
    const dy = targetY - y;
    x += dx * LERP;
    y += dy * LERP;
    spot.style.setProperty('--spot-x', `${x.toFixed(1)}px`);
    spot.style.setProperty('--spot-y', `${y.toFixed(1)}px`);
    // Нормировка в -1..1: амплитуда параллакса не зависит от размера вьюпорта
    const nx = (x / window.innerWidth - 0.5) * 2;
    const ny = (y / window.innerHeight - 0.5) * 2;
    img.style.transform = `translate3d(${(-nx * PARALLAX).toFixed(1)}px, ${(-ny * PARALLAX).toFixed(1)}px, 0)`;
    // Останавливаем цикл после сближения: без движения курсора кадры не тратятся
    raf = Math.abs(dx) + Math.abs(dy) > 0.5 ? requestAnimationFrame(tick) : 0;
  }

  function onPointerMove(event: PointerEvent) {
    targetX = event.clientX;
    targetY = event.clientY;
    if (raf === 0) raf = requestAnimationFrame(tick);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    if (raf !== 0) cancelAnimationFrame(raf);
  };
}
