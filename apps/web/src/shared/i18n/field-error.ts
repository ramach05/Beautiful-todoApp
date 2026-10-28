/** Field error dictionary keys; the map values below are checked by this same type */
type FieldErrorKey =
  | 'validation.fallback'
  | 'validation.title.required'
  | 'validation.title.too_long'
  | 'validation.email.invalid'
  | 'validation.password.short'
  | 'validation.name.short';

/**
 * Form fields and zod issue codes (react-hook-form puts the zod code into FieldError.type) → dictionary keys;
 * the schema message text is not used in the UI
 */
const FIELD_ISSUE_KEYS = {
  title: { too_small: 'validation.title.required', too_big: 'validation.title.too_long' },
  email: { invalid_format: 'validation.email.invalid' },
  password: { too_small: 'validation.password.short' },
  name: { too_small: 'validation.name.short' },
} as const satisfies Record<string, Readonly<Record<string, FieldErrorKey>>>;

export type ValidationField = keyof typeof FIELD_ISSUE_KEYS;

/** Dictionary key for a field error: an unmatched code returns the generic key */
export function fieldErrorKey(field: ValidationField, code?: string): FieldErrorKey {
  const byCode: Readonly<Record<string, FieldErrorKey | undefined>> = FIELD_ISSUE_KEYS[field];
  return byCode[code ?? ''] ?? 'validation.fallback';
}
