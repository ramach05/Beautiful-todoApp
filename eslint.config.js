import base from '@bt/config/eslint/base';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.turbo/**'] },
  ...base,
  {
    // Node-скрипты репозитория: глобальные объекты рантайма для no-undef
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
  },
];
