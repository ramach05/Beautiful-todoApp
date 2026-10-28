import base from '@bt/config/eslint/base';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'src/app/routeTree.gen.ts'] },
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // TanStack route files export a Route object alongside the component by contract
    files: ['src/app/routes/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
];
