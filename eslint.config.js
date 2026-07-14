import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // R3 (2026-07-14): *.workflow.js er Claude Workflow-DSL (phase/agent/
  // parallel + top-level return) — ikke node-kjørbar kode, skal ikke lintes.
  globalIgnores(['dist', 'scripts/*.workflow.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // R3: underscore-prefiks er konvensjonen for bevisst ubrukte parametre
      // (API-bakoverkompatibilitet, f.eks. toggleOwnership(_isPremium)).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
])
