import { defineConfig } from 'steiger';
import fsdPlugin from '@feature-sliced/steiger-plugin';

/**
 * Правила FSD (v2) по умолчанию + точечные мотивированные исключения.
 * Проверка: `pnpm fsd:check` (входит в CI quality).
 */
export default defineConfig([
  ...fsdPlugin.configs.recommended,
  {
    // Слайсы-действия (todo-add, todo-filter) намеренно используются ровно одной страницей:
    // дробление по пользовательским действиям важнее агрегации. Правило несовместимо с
    // точечным отключением (scoping ломает ему анализ ссылок), поэтому off целиком.
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    // providers.tsx — каноническое имя composition root из гайда FSD (app-слой)
    files: ['src/app/providers.tsx'],
    rules: {
      'fsd/segments-by-purpose': 'off',
    },
  },
]);
