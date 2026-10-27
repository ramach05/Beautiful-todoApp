/** Ключи словаря ошибок полей; значения карты ниже проверяются этим же типом */
type FieldErrorKey =
  | 'validation.fallback'
  | 'validation.title.required'
  | 'validation.title.too_long'
  | 'validation.email.invalid'
  | 'validation.password.short'
  | 'validation.name.short';

/**
 * Поля форм и zod-коды issues (react-hook-form кладет код zod в FieldError.type) → ключи словаря;
 * текст сообщения схемы в UI не участвует
 */
const FIELD_ISSUE_KEYS = {
  title: { too_small: 'validation.title.required', too_big: 'validation.title.too_long' },
  email: { invalid_format: 'validation.email.invalid' },
  password: { too_small: 'validation.password.short' },
  name: { too_small: 'validation.name.short' },
} as const satisfies Record<string, Readonly<Record<string, FieldErrorKey>>>;

export type ValidationField = keyof typeof FIELD_ISSUE_KEYS;

/** Ключ словаря для ошибки поля: несопоставленный код отдает общий ключ */
export function fieldErrorKey(field: ValidationField, code?: string): FieldErrorKey {
  const byCode: Readonly<Record<string, FieldErrorKey | undefined>> = FIELD_ISSUE_KEYS[field];
  return byCode[code ?? ''] ?? 'validation.fallback';
}
