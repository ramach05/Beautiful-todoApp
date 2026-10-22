import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * Базовый flat-config: js/ts рекомендации + отключение конфликтующих с prettier правил.
 * Прикладные пакеты расширяют его своими плагинами и globals.
 */
export default [
  { ignores: ['dist/**'] },
  { languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Вытеснение служебных полей через rest-деструктуризацию — идиоматичный прием
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  prettier,
];
