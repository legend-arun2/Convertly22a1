// GitHub Pages has no SPA rewrites: serve index.html for unknown paths via 404.html.
import { copyFileSync, writeFileSync } from 'node:fs'
copyFileSync('dist/index.html', 'dist/404.html')
writeFileSync('dist/.nojekyll', '')
console.log('postbuild: wrote dist/404.html and dist/.nojekyll')
