import { afterEach, expect, it } from 'vitest';

import { registerSpotTarget, startPointerAmbient } from './pointer-ambient';

/** Кадр rAF: в jsdom с pretendToBeVisual колбэки приходят по таймеру */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Слушатель читает только координаты, а PointerEvent в jsdom не реализован */
function movePointer(x: number, y: number): void {
  window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y }));
}

async function settle(frames = 3): Promise<void> {
  for (let i = 0; i < frames; i += 1) await nextFrame();
}

afterEach(() => {
  document.body.innerHTML = '';
});

it('координаты пятна пишутся в зарегистрированный слой, а не в корень документа', async () => {
  const layer = document.createElement('div');
  const spot = document.createElement('div');
  document.body.append(layer, spot);

  const stopAmbient = startPointerAmbient(layer);
  const unregister = registerSpotTarget(spot);

  movePointer(320, 200);
  await settle();

  expect(spot.style.getPropertyValue('--spot-x')).not.toBe('');
  expect(spot.style.getPropertyValue('--spot-boost')).not.toBe('');
  expect(document.documentElement.style.getPropertyValue('--spot-x')).toBe('');
  expect(layer.style.transform).toContain('translate3d');

  unregister?.();
  stopAmbient();
});

it('после отписки элемент больше не получает координаты', async () => {
  const layer = document.createElement('div');
  const spot = document.createElement('div');
  document.body.append(layer, spot);

  const stopAmbient = startPointerAmbient(layer);
  const unregister = registerSpotTarget(spot);

  movePointer(320, 200);
  await settle();
  const written = spot.style.getPropertyValue('--spot-x');
  unregister?.();

  movePointer(10, 10);
  await settle();

  expect(written).not.toBe('');
  expect(spot.style.getPropertyValue('--spot-x')).toBe(written);

  stopAmbient();
});

it('ref-колбэк без элемента ничего не регистрирует', () => {
  expect(registerSpotTarget(null)).toBeUndefined();
});
