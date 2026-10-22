/** Пространство имён clsx-подобного склейщика классов без внешней зависимости */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
