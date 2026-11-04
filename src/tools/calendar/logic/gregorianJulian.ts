/**
 * Gregorian (proleptic) and Julian calendars using "fixed day" numbers (R.D., Rata Die:
 * day 1 = 1 Jan 1 AD Gregorian), after Reingold & Dershowitz, "Calendrical Calculations".
 * Years are astronomical: 1 BC = 0, 2 BC = −1.
 */
import { floor, mod } from './math'

export interface YMD { year: number; month: number; day: number }

export const isGregorianLeap = (y: number) => mod(y, 4) === 0 && ![100, 200, 300].includes(mod(y, 400))
export const isJulianLeap = (y: number) => mod(y, 4) === 0

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
export const gregorianDaysInMonth = (y: number, m: number) => (m === 2 && isGregorianLeap(y) ? 29 : MONTH_DAYS[m - 1])
export const julianDaysInMonth = (y: number, m: number) => (m === 2 && isJulianLeap(y) ? 29 : MONTH_DAYS[m - 1])

export function fixedFromGregorian({ year: y, month: m, day: d }: YMD): number {
  return (
    365 * (y - 1) + floor((y - 1) / 4) - floor((y - 1) / 100) + floor((y - 1) / 400) +
    floor((367 * m - 362) / 12) + (m <= 2 ? 0 : isGregorianLeap(y) ? -1 : -2) + d
  )
}

function gregorianYearFromFixed(date: number): number {
  const d0 = date - 1
  const n400 = floor(d0 / 146097), d1 = mod(d0, 146097)
  const n100 = floor(d1 / 36524), d2 = mod(d1, 36524)
  const n4 = floor(d2 / 1461), d3 = mod(d2, 1461)
  const n1 = floor(d3 / 365)
  const year = 400 * n400 + 100 * n100 + 4 * n4 + n1
  return n100 === 4 || n1 === 4 ? year : year + 1
}

export function gregorianFromFixed(date: number): YMD {
  const year = gregorianYearFromFixed(date)
  const prior = date - fixedFromGregorian({ year, month: 1, day: 1 })
  const corr = date < fixedFromGregorian({ year, month: 3, day: 1 }) ? 0 : isGregorianLeap(year) ? 1 : 2
  const month = floor((12 * (prior + corr) + 373) / 367)
  const day = date - fixedFromGregorian({ year, month, day: 1 }) + 1
  return { year, month, day }
}

const JULIAN_EPOCH = -1 // fixed date of 1 Jan 1 AD (Julian)

export function fixedFromJulian({ year: y, month: m, day: d }: YMD): number {
  return (
    JULIAN_EPOCH - 1 + 365 * (y - 1) + floor((y - 1) / 4) +
    floor((367 * m - 362) / 12) + (m <= 2 ? 0 : isJulianLeap(y) ? -1 : -2) + d
  )
}

export function julianFromFixed(date: number): YMD {
  const year = floor((4 * (date - JULIAN_EPOCH) + 1464) / 1461)
  const prior = date - fixedFromJulian({ year, month: 1, day: 1 })
  const corr = date < fixedFromJulian({ year, month: 3, day: 1 }) ? 0 : isJulianLeap(year) ? 1 : 2
  const month = floor((12 * (prior + corr) + 373) / 367)
  const day = date - fixedFromJulian({ year, month, day: 1 }) + 1
  return { year, month, day }
}

/** Day of week: 0 = Sunday … 6 = Saturday. */
export const dayOfWeek = (date: number) => mod(date, 7)
/** Julian Day Number (integer, noon-based) for a fixed date. */
export const jdnFromFixed = (date: number) => date + 1721425
