/**
 * Approximate subsolar point (where the sun is directly overhead) for a UTC instant.
 * Accurate to well under a degree — plenty for drawing day/night on a world map.
 */
const rad = Math.PI / 180

export function subsolarPoint(epochMs: number): { lat: number; lon: number } {
  const n = epochMs / 86_400_000 + 2440587.5 - 2451545.0 // days since J2000
  const L = (280.46 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * rad
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad
  const eps = (23.439 - 0.0000004 * n) * rad
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda))
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / rad
  const gmst = (18.697374558 + 24.06570982441908 * n) * 15 // degrees
  let lon = (ra - gmst) % 360
  if (lon > 180) lon -= 360
  if (lon < -180) lon += 360
  return { lat: decl / rad, lon }
}

/** Center of the night hemisphere (the antisolar point). */
export function antisolarPoint(epochMs: number): [number, number] {
  const { lat, lon } = subsolarPoint(epochMs)
  return [lon > 0 ? lon - 180 : lon + 180, -lat]
}
