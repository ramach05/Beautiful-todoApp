import { defineConfig } from 'steiger';
import fsdPlugin from '@feature-sliced/steiger-plugin';

/**
 * FSD (v2) default rules plus targeted justified exceptions.
 * Check: `pnpm fsd:check` (part of CI quality).
 */
export default defineConfig([
  ...fsdPlugin.configs.recommended,
  {
    // Action slices (todo-add, todo-filter) are intentionally used by exactly one page:
    // splitting by user action matters more than aggregation. The rule is incompatible with
    // per-file disabling (scoping breaks its reference analysis), so it is off entirely.
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    // providers.tsx is the canonical composition root name from the FSD guide (app layer)
    files: ['src/app/providers.tsx'],
    rules: {
      'fsd/segments-by-purpose': 'off',
    },
  },
]);
