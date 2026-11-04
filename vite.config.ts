/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { CSP } from './csp.config'

// VITE_BASE lets the same code deploy to GitHub Pages (/<repo>/) or Vercel (/).
const base = process.env.VITE_BASE || '/'

/** Adds the CSP <meta> to production builds only (the dev server injects inline scripts). */
const cspPlugin = (): Plugin => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
  },
})

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), cspPlugin()],
  build: {
    sourcemap: false,
    // All supported browsers have native modulepreload; skipping the polyfill removes a fetch() from the bundle.
    modulePreload: { polyfill: false },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
