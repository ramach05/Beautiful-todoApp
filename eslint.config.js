import base from '@bt/config/eslint/base';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.turbo/**'] },
  ...base,
];
