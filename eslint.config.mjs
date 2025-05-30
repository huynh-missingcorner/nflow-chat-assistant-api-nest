// @ts-check
import eslint from '@eslint/js';
import * as importPlugin from 'eslint-plugin-import';
import * as importAliasPlugin from 'eslint-plugin-import-alias';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import { builtinModules } from 'node:module';
import tseslint from 'typescript-eslint';

const nodeBuiltinRegex = `^(${builtinModules.join('|')})(/|$)`;

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'commitlint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      import: importPlugin,
      'import-alias': importAliasPlugin,
    },
    settings: {
      'import-alias': {
        map: [['@', 'src']],
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // 🚀 Import sorting
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Node.js builtins
            ['^node:', nodeBuiltinRegex],
            // External packages (NestJS, lodash, etc.)
            ['^@nestjs/', '^@?\\w'],
            // Your alias imports (e.g., @/...)
            ['^@/'],
            // Side effect imports
            ['^\\u0000'],
            // Relative imports (./ or ../)
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // 🚨 Convert long relative paths to @
      'import-alias/import-alias': [
        'error',
        {
          relativeDepth: 1,
          alias: '@',
          matchDepth: 1,
        },
      ],

      // 🧹 Clean import rules
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
    },
  },
);
