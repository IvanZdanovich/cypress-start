import cypress from 'eslint-plugin-cypress';
import chaiFriendly from 'eslint-plugin-chai-friendly';
import customPlugin from './eslint-plugin-custom-rules/index.js';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = process.cwd();
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ['**/node_modules', '**/dist', '**/cypress/reports'], // Add your ignore patterns here
  },
  ...compat.extends('plugin:chai-friendly/recommended', 'plugin:prettier/recommended'),
  {
    plugins: {
      cypress,
      custom: customPlugin,
      'chai-friendly': chaiFriendly,
    },
    rules: {
      'prettier/prettier': 'warn',
      semi: ['error', 'always'],
      'no-multi-spaces': 'error',
      'no-multiple-empty-lines': 'error',
      'no-unused-vars': 'error',
      'no-use-before-define': 'error',
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-force': 'warn',
      'cypress/no-async-tests': 'error',
      'cypress/unsafe-to-chain-command': 'error',
      'no-unused-expressions': 'warn',
      'chai-friendly/no-unused-expressions': 'error',
      'custom/do-not-allow-empty-blocks': 'error',
      'custom/prevent-duplicated-titles': 'error',
      'custom/prevent-test-data-loops': 'error',
      'custom/verify-test-title-without-forbidden-symbols': 'error',
      'custom/verify-test-title-pattern': 'error',
      'custom/verify-test-title-against-structure': 'error',
      'custom/verify-todos-have-links': 'error',
      'custom/standardize-test-titles': 'warn',
      'custom/verify-api-command-naming': 'error',
      'custom/verify-ui-command-naming': 'error',
    },
  },
];
