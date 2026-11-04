/** Small cached fetch helper, ready for future live-data tools (e.g. currency rates). */
const cache = new Map<string, { at: number; data: unknown }>()

export async function getJson<T>(url: string, maxAgeMs = 10 * 60_000): Promise<T> {
  const hit = cache.get(url)
  if (hit && Date.now() - hit.at < maxAgeMs) return hit.data as T
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${url}`)
  const data = (await res.json()) as T
  cache.set(url, { at: Date.now(), data })
  return data
}
