/**
 * Like Date.UTC, but years 0–99 are taken literally (Date.UTC maps them to 1900–1999).
 * Returns NaN outside JavaScript's date range (about ±275,000 years).
 */
export function utcMs(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): number {
  const d = new Date(0)
  d.setUTCFullYear(year, month - 1, day)
  d.setUTCHours(hour, minute, second, 0)
  return d.getTime()
}

/** Largest |epoch ms| a JavaScript Date can hold. */
export const MAX_EPOCH_MS = 8.64e15
