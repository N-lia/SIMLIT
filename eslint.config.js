import js from '@eslint/js'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'android', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['playwright.config.js', 'tests/**/*.js', 'vite.config.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
])
