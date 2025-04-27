import parser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from './.prettierrc.json' with { type: 'json' };

/** @type {import("eslint").ESLint.ConfigData} */
export default [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'], // Add `.tsx` if you're using React
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json', // Optional: use if you want full type checking
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'prettier/prettier': ['error', prettierConfig],
      '@typescript-eslint/no-explicit-any': 'off', // Disable the rule globally
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'src/**/*.d.ts'],
  },
];

