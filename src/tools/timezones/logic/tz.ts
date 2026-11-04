/** Time zone math using only the built-in Intl API (DST-correct, no extra library). */
import { utcMs } from '../../../lib/dates'

const dtfCache = new Map<string, Intl.DateTimeFormat>()
function dtf(zone: string, opts: Intl.DateTimeFormatOptions, key: string) {
  const k = zone + '|' + key
  let f = dtfCache.get(k)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: zone, ...opts })
    dtfCache.set(k, f)
  }
  return f
}

export function isValidZone(zone: string): boolean {
  try {
    dtf(zone, {}, 'valid')
    return true
  } catch {
    return false
  }
}

export interface ZonedParts { year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number }

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export function zonedParts(zone: string, epochMs: number): ZonedParts {
  const parts = dtf(zone, {
    hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short', era: 'short',
  }, 'parts').formatToParts(epochMs)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  let year = Number(get('year'))
  if (get('era') === 'BC') year = 1 - year
  return {
    year, month: Number(get('month')), day: Number(get('day')),
    hour: Number(get('hour')) % 24, minute: Number(get('minute')), second: Number(get('second')),
    weekday: WD[get('weekday')] ?? 0,
  }
}

/** UTC offset in minutes (e.g. +330 for India) at the given instant. */
export function offsetMinutes(zone: string, epochMs: number): number {
  const p = zonedParts(zone, epochMs)
  const asUtc = utcMs(p.year, p.month, p.day, p.hour, p.minute, p.second)
  const ms = Math.floor(epochMs / 1000) * 1000
  return Math.round((asUtc - ms) / 60000)
}

/**
 * Instant for a wall-clock time in a zone. Times skipped by DST move forward;
 * repeated times resolve to the earlier occurrence (same as Temporal's "compatible").
 */
export function wallTimeToEpoch(zone: string, y: number, mo: number, d: number, h: number, mi: number): number {
  const utcGuess = utcMs(y, mo, d, h, mi)
  if (!Number.isFinite(utcGuess)) return NaN
  const o1 = offsetMinutes(zone, utcGuess)
  const t1 = utcGuess - o1 * 60000
  const o2 = offsetMinutes(zone, t1)
  if (o1 === o2) {
    // Check for an earlier valid occurrence (repeated time when clocks go back). The window
    // covers historic shifts of many hours; the candidate is validated before use.
    const oBefore = offsetMinutes(zone, t1 - 25 * 3600_000)
    const tEarlier = utcGuess - oBefore * 60000
    if (oBefore !== o1 && offsetMinutes(zone, tEarlier) === oBefore) return tEarlier
    return t1
  }
  const t2 = utcGuess - o2 * 60000
  if (offsetMinutes(zone, t2) === o2) return t2
  // Wall time does not exist (spring forward): use the offset from before the gap.
  return utcGuess - Math.min(o1, o2) * 60000
}

export function formatOffset(min: number): string {
  const sign = min < 0 ? '−' : '+'
  const a = Math.abs(min)
  const h = Math.floor(a / 60), m = a % 60
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`
}

/** Difference like "+5h 30m", "−3h", "same time". */
export function formatDiff(min: number): string {
  if (min === 0) return 'same time'
  const sign = min < 0 ? '−' : '+'
  const a = Math.abs(min)
  const h = Math.floor(a / 60), m = a % 60
  return `${sign}${h ? h + 'h' : ''}${h && m ? ' ' : ''}${m ? m + 'm' : ''}`
}

export function abbreviation(zone: string, epochMs: number): string {
  const p = dtf(zone, { timeZoneName: 'short' }, 'abbr').formatToParts(epochMs)
  return p.find((x) => x.type === 'timeZoneName')?.value ?? ''
}

export function longName(zone: string, epochMs: number): string {
  const p = dtf(zone, { timeZoneName: 'long' }, 'long').formatToParts(epochMs)
  return p.find((x) => x.type === 'timeZoneName')?.value ?? zone
}

export function formatTime(zone: string, epochMs: number, hour12 = false): string {
  return dtf(zone, { hour: 'numeric', minute: '2-digit', hour12 }, 'time' + hour12).format(epochMs)
}

export function formatDate(zone: string, epochMs: number): string {
  return dtf(zone, { weekday: 'short', day: 'numeric', month: 'short' }, 'date').format(epochMs)
}

/** "Los_Angeles" → "Los Angeles"; "America/Argentina/Buenos_Aires" → "Buenos Aires". */
export function cityName(zone: string): string {
  if (zone === 'UTC' || zone === 'Etc/UTC') return 'UTC'
  return zone.split('/').pop()!.replace(/_/g, ' ')
}

export function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Calendar-day difference between two zones' local dates (−1, 0, +1). */
export function dayShift(zone: string, refZone: string, epochMs: number): number {
  const a = zonedParts(zone, epochMs), b = zonedParts(refZone, epochMs)
  return Math.round((utcMs(a.year, a.month, a.day) - utcMs(b.year, b.month, b.day)) / 86_400_000)
}
