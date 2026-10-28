/** Whether the OS asks to reduce animations; read where motion is driven by JS, not CSS */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
