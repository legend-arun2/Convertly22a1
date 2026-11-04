/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// VITE_BASE lets the same code deploy to GitHub Pages (/<repo>/) or Vercel (/).
const base = process.env.VITE_BASE || '/'

/**
 * Content-Security-Policy for production builds only (the dev server injects inline scripts).
 * Keep in sync with the header in vercel.json. When adding live-data APIs, list their hosts in connect-src.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const cspPlugin = (): Plugin => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
})

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), cspPlugin()],
  build: { sourcemap: false },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
