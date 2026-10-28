/** Lerp factor: the smaller it is, the softer the cursor catch-up */
const LERP = 0.13;

/** Background parallax amplitude in px: shifts opposite to the cursor */
const PARALLAX = 22;

/** Total per-frame shift at which the spot's hot core reaches its maximum */
const BOOST_MAX_SPEED = 70;

/** Boost smoothing: the spot brightens and fades smoothly */
const BOOST_LERP = 0.08;

const noop = () => {};

/**
 * Consumers of cursor coordinates. We write variables into them, not into the root: changing an
 * inherited custom property on the root invalidates the whole document's styles and drops fps during drag-n-drop.
 */
const spotTargets = new Set<HTMLElement>();

/**
 * Registers a consumer element of --spot-x/--spot-y/--spot-boost; null is accepted for
 * ref callbacks. Only suitable for leaf elements: writing invalidates its subtree.
 */
export function registerSpotTarget(el: HTMLElement | null): (() => void) | undefined {
  if (!el) return undefined;
  spotTargets.add(el);
  return () => spotTargets.delete(el);
}

/**
 * Cursor tracking for background effects: writes --spot-x/--spot-y/--spot-boost
 * into registered elements and translate3d on the background layer via one rAF loop
 * without React re-renders.
 * On touch (pointer: coarse) and with prefers-reduced-motion it attaches no listeners at all.
 */
export function startPointerAmbient(layer: HTMLElement): () => void {
  // Without matchMedia (jsdom) the modes cannot be detected: effects are off
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
    // The speed of catching up with the cursor signals active movement
    const speed = Math.abs(dx) + Math.abs(dy);
    boost += (Math.min(1, speed / BOOST_MAX_SPEED) - boost) * BOOST_LERP;
    const spotBoost = boost.toFixed(3);
    for (const target of spotTargets) {
      target.style.setProperty('--spot-x', spotX);
      target.style.setProperty('--spot-y', spotY);
      target.style.setProperty('--spot-boost', spotBoost);
    }
    // Normalize to -1..1: parallax amplitude does not depend on viewport size
    const nx = (x / window.innerWidth - 0.5) * 2;
    const ny = (y / window.innerHeight - 0.5) * 2;
    layer.style.transform = `translate3d(${(-nx * PARALLAX).toFixed(1)}px, ${(-ny * PARALLAX).toFixed(1)}px, 0)`;
    // The loop runs until a full stop: the boost must have time to fade out
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
