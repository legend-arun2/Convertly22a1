/**
 * Single source of truth for the Content-Security-Policy.
 * - Injected as a <meta> tag into production builds (vite.config.ts) and verified by scripts/postbuild.mjs.
 * - Sent as an HTTP header on Vercel (vercel.json, kept in sync by src/security.test.ts) with frame-ancestors added.
 * When adding a live-data API, add its host to connect-src (and to ALLOWED_HOSTS in src/services/http.ts).
 */
export const CSP_DIRECTIVES = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  "require-trusted-types-for 'script'",
  "trusted-types 'none'",
]

export const CSP = CSP_DIRECTIVES.join('; ')

/** frame-ancestors only works as an HTTP header (ignored in <meta>). */
export const CSP_HEADER = `${CSP}; frame-ancestors 'none'`
