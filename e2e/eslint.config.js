import base from '@bt/config/eslint/base';
import globals from 'globals';

export default [
  ...base,
  {
    files: ['**/*.ts'],
    languageOptions: { globals: globals.node },
  },
];
