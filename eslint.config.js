import base from '@bt/config/eslint/base';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.turbo/**'] },
  ...base,
  {
    // Repository Node scripts: runtime globals for no-undef
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
];
