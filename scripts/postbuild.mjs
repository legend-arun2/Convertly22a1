// 1. Fail the build if the Content-Security-Policy meta tag is missing (never ship without it).
// 2. GitHub Pages has no SPA rewrites: serve index.html for unknown paths via 404.html.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync('dist/index.html', 'utf8')
// Vite may HTML-escape the quotes (&#39;), which browsers decode back to '.
const decoded = html.replace(/&#39;/g, "'")
const headStart = decoded.slice(0, decoded.indexOf('<script'))
if (!/<meta http-equiv="Content-Security-Policy" content="default-src 'none';/.test(headStart)) {
  console.error('postbuild: Content-Security-Policy meta tag missing from dist/index.html (or not before the first script)')
  process.exit(1)
}
if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) {
  console.error('postbuild: inline <script> found in dist/index.html (blocked by the CSP)')
  process.exit(1)
}
copyFileSync('dist/index.html', 'dist/404.html')
writeFileSync('dist/.nojekyll', '')
console.log('postbuild: CSP verified; wrote dist/404.html and dist/.nojekyll')
