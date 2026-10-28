/** Коэффициент lerpa: чем меньше, тем мягче догоняние курсора */
const LERP = 0.13;

/** Амплитуда параллакса фона в px: смещение в сторону, противоположную курсору */
const PARALLAX = 22;

/** Суммарный сдвиг за кадр, при котором горячее ядро пятна достигает максимума */
const BOOST_MAX_SPEED = 70;

/** Сглаживание буста: пятно разгорается и гаснет плавно */
const BOOST_LERP = 0.08;

const noop = () => {};

/**
 * Потребители координат курсора. Пишем переменные в них, а не в корень: смена наследуемого
 * кастомного свойства на корне инвалидирует стили всего документа и роняет fps при drag-n-drop.
 */
const spotTargets = new Set<HTMLElement>();

/**
 * Регистрирует элемент-потребитель --spot-x/--spot-y/--spot-boost; null принимается для
 * ref-колбэков. Подходит только для элементов-листьев: запись инвалидирует его поддерево.
 */
export function registerSpotTarget(el: HTMLElement | null): (() => void) | undefined {
  if (!el) return undefined;
  spotTargets.add(el);
  return () => spotTargets.delete(el);
}

/**
 * Слежение за курсором для фоновых эффектов: пишет --spot-x/--spot-y/--spot-boost
 * в зарегистрированные элементы и translate3d на слой фона через один rAF-цикл
 * без ре-рендеров React.
 * На таче (pointer: coarse) и при prefers-reduced-motion не вешает слушателей вовсе.
 */
export function startPointerAmbient(layer: HTMLElement): () => void {
  // Без matchMedia (jsdom) режимы не определить: эффекты выключены
  if (typeof window.matchMedia !== 'function') return noop;
  if (window.matchMedia('(pointer: coarse)').matches) return noop;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return noop;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let boost = 0;
  let raf = 0;

  function tick() {
    const dx = targetX - x;
    const dy = targetY - y;
    x += dx * LERP;
    y += dy * LERP;
    const spotX = `${x.toFixed(1)}px`;
    const spotY = `${y.toFixed(1)}px`;
    // Скорость сближения с курсором служит признаком активного движения
    const speed = Math.abs(dx) + Math.abs(dy);
    boost += (Math.min(1, speed / BOOST_MAX_SPEED) - boost) * BOOST_LERP;
    const spotBoost = boost.toFixed(3);
    for (const target of spotTargets) {
      target.style.setProperty('--spot-x', spotX);
      target.style.setProperty('--spot-y', spotY);
      target.style.setProperty('--spot-boost', spotBoost);
    }
    // Нормировка в -1..1: амплитуда параллакса не зависит от размера вьюпорта
    const nx = (x / window.innerWidth - 0.5) * 2;
    const ny = (y / window.innerHeight - 0.5) * 2;
    layer.style.transform = `translate3d(${(-nx * PARALLAX).toFixed(1)}px, ${(-ny * PARALLAX).toFixed(1)}px, 0)`;
    // Цикл стоит до полной остановки: буст должен успеть погаснуть
    raf = speed > 0.5 || boost > 0.01 ? requestAnimationFrame(tick) : 0;
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
