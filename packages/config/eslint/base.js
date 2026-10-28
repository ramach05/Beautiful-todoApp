import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

/**
 * Base flat-config: js/ts recommendations + disabling rules that conflict with prettier.
 * Application packages extend it with their own plugins and globals.
 */
export default [
  { ignores: ['dist/**'] },
  { languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Dropping internal fields via rest destructuring is an idiomatic pattern
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  prettier,
];
