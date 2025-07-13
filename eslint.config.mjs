import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': typescript,
      import: importPlugin,
      '@next/next': nextPlugin,
    },
    rules: {
      // 禁用一些不必要的規則
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/prefer-nullish-coalescing-assignment': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-array-index-key': 'off',
      'react/jsx-sort-props': 'off',
      'react/jsx-indent': 'off',
      'react/jsx-indent-props': 'off',
      'react/jsx-closing-tag-location': 'off',
      'react/self-closing-comp': 'off',
      'react/no-unknown-property': 'off',
      'react/jsx-tag-spacing': 'off',
      'react/jsx-closing-bracket-location': 'off',
      'no-alert': 'off',
      'func-style': 'off',
      'import/order': 'off',
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      'import/no-unassigned-import': 'off',
      'import/no-cycle': 'off',
      'import/max-dependencies': 'off',
      'import/exports-last': 'off',
      'no-undef': 'off',
      'semi': 'off',
      'comma-dangle': 'off',
      'comma-spacing': 'off',
      'indent': 'off',
      'quotes': 'off',
      'prefer-template': 'off',
      '@next/next/no-img-element': 'off',
      
      // 保留一些重要的規則
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**'],
  },
];
