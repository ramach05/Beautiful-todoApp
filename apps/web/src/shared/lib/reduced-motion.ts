/** Просит ли ОС уменьшить анимации; читают места, где движение задает JS, а не CSS */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
