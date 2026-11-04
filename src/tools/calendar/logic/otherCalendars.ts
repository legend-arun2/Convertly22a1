/**
 * Arithmetic calendars (exact, two-way), after Reingold & Dershowitz.
 * All functions use fixed day numbers (R.D.).
 */
import { floor, mod } from './math'
import { fixedFromGregorian, gregorianFromFixed, fixedFromJulian, isGregorianLeap, type YMD } from './gregorianJulian'

// ---------- Islamic (tabular / civil) ----------
const ISLAMIC_EPOCH = fixedFromJulian({ year: 622, month: 7, day: 16 })
export const isIslamicLeap = (y: number) => mod(14 + 11 * y, 30) < 11
export const islamicDaysInMonth = (y: number, m: number) => (m % 2 === 1 || (m === 12 && isIslamicLeap(y)) ? 30 : 29)
export function fixedFromIslamic({ year: y, month: m, day: d }: YMD) {
  return d + 29 * (m - 1) + floor((6 * m - 1) / 11) + (y - 1) * 354 + floor((3 + 11 * y) / 30) + ISLAMIC_EPOCH - 1
}
export function islamicFromFixed(date: number): YMD {
  const year = floor((30 * (date - ISLAMIC_EPOCH) + 10646) / 10631)
  const prior = date - fixedFromIslamic({ year, month: 1, day: 1 })
  const month = floor((11 * prior + 330) / 325)
  const day = date - fixedFromIslamic({ year, month, day: 1 }) + 1
  return { year, month, day }
}

// ---------- Hebrew ----------
// Months numbered as in R&D: 1 = Nisan … 7 = Tishri … 12 = Adar (Adar I in leap years), 13 = Adar II.
const HEBREW_EPOCH = fixedFromJulian({ year: -3760, month: 10, day: 7 })
export const isHebrewLeap = (y: number) => mod(7 * y + 1, 19) < 7
export const hebrewLastMonth = (y: number) => (isHebrewLeap(y) ? 13 : 12)
function hebrewElapsedDays(y: number) {
  const months = floor((235 * y - 234) / 19)
  const parts = 12084 + 13753 * months
  const day = 29 * months + floor(parts / 25920)
  return mod(3 * (day + 1), 7) < 3 ? day + 1 : day
}
function hebrewYearLengthCorrection(y: number) {
  const ny0 = hebrewElapsedDays(y - 1), ny1 = hebrewElapsedDays(y), ny2 = hebrewElapsedDays(y + 1)
  if (ny2 - ny1 === 356) return 2
  if (ny1 - ny0 === 382) return 1
  return 0
}
const hebrewNewYear = (y: number) => HEBREW_EPOCH + hebrewElapsedDays(y) + hebrewYearLengthCorrection(y)
const hebrewDaysInYear = (y: number) => hebrewNewYear(y + 1) - hebrewNewYear(y)
export function hebrewDaysInMonth(y: number, m: number) {
  const len = hebrewDaysInYear(y)
  if ([2, 4, 6, 10, 13].includes(m)) return 29
  if (m === 12 && !isHebrewLeap(y)) return 29
  if (m === 8 && len % 10 !== 5) return 29 // Marheshvan is long only in 355/385-day years
  if (m === 9 && len % 10 === 3) return 29 // Kislev is short in 353/383-day years
  return 30
}
export function fixedFromHebrew({ year: y, month: m, day: d }: YMD) {
  let total = hebrewNewYear(y) + d - 1
  if (m < 7) {
    for (let mm = 7; mm <= hebrewLastMonth(y); mm++) total += hebrewDaysInMonth(y, mm)
    for (let mm = 1; mm < m; mm++) total += hebrewDaysInMonth(y, mm)
  } else {
    for (let mm = 7; mm < m; mm++) total += hebrewDaysInMonth(y, mm)
  }
  return total
}
export function hebrewFromFixed(date: number): YMD {
  const approx = floor((date - HEBREW_EPOCH) / (35975351 / 98496)) + 1
  let year = approx - 1
  while (hebrewNewYear(year + 1) <= date) year++
  const start = date < fixedFromHebrew({ year, month: 1, day: 1 }) ? 7 : 1
  let month = start
  while (date > fixedFromHebrew({ year, month, day: hebrewDaysInMonth(year, month) })) month++
  const day = date - fixedFromHebrew({ year, month, day: 1 }) + 1
  return { year, month, day }
}
/** Months in the order they occur within a Hebrew year (starting at Tishri). */
export const hebrewMonthOrder = (y: number) => [...Array.from({ length: hebrewLastMonth(y) - 6 }, (_, i) => i + 7), 1, 2, 3, 4, 5, 6]

// ---------- Coptic & Ethiopic ----------
const COPTIC_EPOCH = fixedFromJulian({ year: 284, month: 8, day: 29 })
const ETHIOPIC_EPOCH = fixedFromJulian({ year: 8, month: 8, day: 29 })
const alexandrianDaysInMonth = (y: number, m: number) => (m < 13 ? 30 : mod(y, 4) === 3 ? 6 : 5)
function fixedFromAlex(epoch: number, { year: y, month: m, day: d }: YMD) {
  return epoch - 1 + 365 * (y - 1) + floor(y / 4) + 30 * (m - 1) + d
}
function alexFromFixed(epoch: number, date: number): YMD {
  const year = floor((4 * (date - epoch) + 1463) / 1461)
  const month = floor((date - fixedFromAlex(epoch, { year, month: 1, day: 1 })) / 30) + 1
  const day = date + 1 - fixedFromAlex(epoch, { year, month, day: 1 })
  return { year, month, day }
}
export const copticDaysInMonth = alexandrianDaysInMonth
export const fixedFromCoptic = (d: YMD) => fixedFromAlex(COPTIC_EPOCH, d)
export const copticFromFixed = (date: number) => alexFromFixed(COPTIC_EPOCH, date)
export const ethiopicDaysInMonth = alexandrianDaysInMonth
export const fixedFromEthiopic = (d: YMD) => fixedFromAlex(ETHIOPIC_EPOCH, d)
export const ethiopicFromFixed = (date: number) => alexFromFixed(ETHIOPIC_EPOCH, date)

// ---------- Indian national (Saka) ----------
const sakaStart = (sakaYear: number) => {
  const gy = sakaYear + 78
  return fixedFromGregorian({ year: gy, month: 3, day: isGregorianLeap(gy) ? 21 : 22 })
}
export function sakaDaysInMonth(y: number, m: number) {
  if (m === 1) return isGregorianLeap(y + 78) ? 31 : 30
  return m <= 6 ? 31 : 30
}
export function fixedFromSaka({ year: y, month: m, day: d }: YMD) {
  let total = sakaStart(y) + d - 1
  for (let mm = 1; mm < m; mm++) total += sakaDaysInMonth(y, mm)
  return total
}
export function sakaFromFixed(date: number): YMD {
  let year = gregorianFromFixed(date).year - 78
  if (date < sakaStart(year)) year--
  let rest = date - sakaStart(year)
  let month = 1
  while (rest >= sakaDaysInMonth(year, month)) { rest -= sakaDaysInMonth(year, month); month++ }
  return { year, month, day: rest + 1 }
}

// ---------- Thai solar (Buddhist era) ----------
export const BUDDHIST_OFFSET = 543
