import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: 'import { h, Fragment } from "/src/utils/react-lite.js"',
  },
})
