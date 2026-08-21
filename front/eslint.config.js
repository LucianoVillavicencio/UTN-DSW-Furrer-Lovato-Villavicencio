import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
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
      // Every section component fetches on mount through a plain useEffect, so
      // the rule fires on all of them. Satisfying it means not calling a
      // state-setting function from an effect at all, which needs a data layer
      // (React Query, SWR or Suspense) rather than a local edit. Kept as a
      // warning so the debt stays visible instead of being disabled.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
])
