// Applies the saved (or system) theme before first paint to avoid a flash.
// External file (not inline) so the Content-Security-Policy needs no script hash.
try {
  var saved = JSON.parse(localStorage.getItem('convertly:theme') || 'null')
  var dark = saved === 'dark' || (saved !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
} catch (e) {}
