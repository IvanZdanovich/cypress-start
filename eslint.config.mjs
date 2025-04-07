import pluginJs from '@eslint/js';
import cypress from 'eslint-plugin-cypress';
import customPlugin from './eslint-plugin-custom-rules/index.js';
import prettier from 'eslint-plugin-prettier';

export default [
  pluginJs.configs.recommended,
  {
    ignores: ['**/node_modules', '**/dist', '**/cypress/reports'],
  },
  {
    plugins: {
      cypress,
      custom: customPlugin,
      prettier,
    },
    rules: {
      'prettier/prettier': 'warn',
      semi: ['error', 'always'],
      'no-undef': 'off',
      'no-multi-spaces': 'error',
      'no-multiple-empty-lines': 'error',
      'no-unused-vars': 'error',
      'no-use-before-define': 'error',
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-force': 'warn',
      'cypress/no-async-tests': 'error',
      'custom/do-not-allow-empty-blocks': 'error',
      'custom/prevent-duplicated-titles': 'error',
      'custom/verify-test-title-pattern': 'error',
      'custom/verify-test-title-against-structure': 'error',
      'custom/verify-test-title-witout-forbidden-symbols': 'error',
      // 'custom/verify-todos-have-links': 'error',
    },
  },
];
