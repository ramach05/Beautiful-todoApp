/** Namespace for a clsx-like class joiner without an external dependency */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
