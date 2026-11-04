import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CSP_HEADER } from '../csp.config'

describe('security config', () => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'))
  const header = (key: string) => vercel.headers[0].headers.find((h: { key: string }) => h.key === key)?.value

  it('vercel.json CSP header matches csp.config.ts', () => {
    expect(header('Content-Security-Policy')).toBe(CSP_HEADER)
  })
  it('vercel.json sends the hardening headers', () => {
    for (const k of ['Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Cross-Origin-Opener-Policy']) {
      expect(header(k), k).toBeTruthy()
    }
  })
  it('SPA rewrite does not swallow missing assets', () => {
    expect(vercel.rewrites[0].source).toBe('/((?!assets/).*)')
  })
  it('index.html has no inline scripts', () => {
    expect(readFileSync('index.html', 'utf8')).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/i)
  })
})
