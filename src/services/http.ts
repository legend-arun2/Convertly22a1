/**
 * Cached JSON fetch for future live-data tools (e.g. currency rates).
 *
 * Rules:
 * - Only hosts in ALLOWED_HOSTS can be fetched (also add them to the CSP connect-src in vite.config.ts / vercel.json).
 * - Never build URLs from raw user input: use a fixed base and encodeURIComponent for path segments.
 * - Never put API secrets in VITE_* variables: they end up in the public bundle. Use a server-side proxy.
 * - Validate the response shape with `validate` before trusting it.
 */
export const ALLOWED_HOSTS = new Set<string>([
  // 'api.example.com',
])

const MAX_ENTRIES = 50
const cache = new Map<string, { at: number; data: unknown }>()

export class HttpError extends Error {}

export async function getJson<T>(
  url: string,
  validate: (data: unknown) => data is T,
  { maxAgeMs = 10 * 60_000, timeoutMs = 10_000 }: { maxAgeMs?: number; timeoutMs?: number } = {},
): Promise<T> {
  const u = new URL(url, location.origin)
  if (u.origin !== location.origin && (u.protocol !== 'https:' || !ALLOWED_HOSTS.has(u.hostname))) {
    throw new HttpError(`Host not allowed: ${u.hostname}`)
  }
  const key = u.toString()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < maxAgeMs) return structuredClone(hit.data) as T

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  const safeUrl = u.origin + u.pathname // never echo query strings (may contain keys) in errors
  try {
    const res = await fetch(key, { credentials: 'omit', signal: ctrl.signal, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new HttpError(`Request failed (${res.status}): ${safeUrl}`)
    if (!res.headers.get('content-type')?.includes('json')) throw new HttpError(`Unexpected content type: ${safeUrl}`)
    const data: unknown = await res.json()
    if (!validate(data)) throw new HttpError(`Unexpected response shape: ${safeUrl}`)
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!)
    cache.set(key, { at: Date.now(), data })
    return structuredClone(data)
  } catch (e) {
    // Serve stale data if we have it rather than failing outright.
    if (hit) return structuredClone(hit.data) as T
    if (e instanceof DOMException && e.name === 'AbortError') throw new HttpError(`Request timed out: ${safeUrl}`)
    throw e
  } finally {
    clearTimeout(timer)
  }
}
