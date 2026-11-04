import {
  dayOfWeek, fixedFromGregorian, fixedFromJulian, gregorianDaysInMonth, gregorianFromFixed,
  julianDaysInMonth, julianFromFixed, type YMD,
} from './gregorianJulian'
import {
  BUDDHIST_OFFSET, copticDaysInMonth, copticFromFixed, ethiopicDaysInMonth, ethiopicFromFixed,
  fixedFromCoptic, fixedFromEthiopic, fixedFromHebrew, fixedFromIslamic, fixedFromSaka,
  hebrewDaysInMonth, hebrewFromFixed, hebrewMonthOrder, islamicDaysInMonth, islamicFromFixed,
  isHebrewLeap, sakaDaysInMonth, sakaFromFixed,
} from './otherCalendars'
import { fromAstronomical, eraLabel, type Notation } from './era'

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const GREG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/**
 * A calendar system. "exact" calendars convert both ways with pure arithmetic.
 * "display" calendars (astronomical/observational) are shown via the browser's Intl data only.
 */
export interface CalendarSystem {
  id: string
  name: string
  kind: 'exact' | 'display'
  /** Uses AD/BC eras for input (year ≥ 1 + era select). */
  usesEra?: boolean
  note?: string
  months?: (year: number) => { value: number; label: string }[]
  daysInMonth?: (year: number, month: number) => number
  toFixed?: (d: YMD) => number
  fromFixed?: (date: number) => YMD
  format: (date: number, notation: Notation) => string
}

const fmtEra = (d: YMD, months: string[], notation: Notation) => {
  const { year, era } = fromAstronomical(d.year)
  return `${d.day} ${months[d.month - 1]} ${year} ${eraLabel(era, notation)}`
}

const simple = (names: string[]) => () => names.map((label, i) => ({ value: i + 1, label }))

const ISLAMIC_MONTHS = ['Muharram', 'Safar', 'Rabiʻ I', 'Rabiʻ II', 'Jumada I', 'Jumada II', 'Rajab', 'Shaʻban', 'Ramadan', 'Shawwal', 'Dhu al-Qaʻdah', 'Dhu al-Hijjah']
const HEBREW_NAMES: Record<number, string> = { 1: 'Nisan', 2: 'Iyyar', 3: 'Sivan', 4: 'Tammuz', 5: 'Av', 6: 'Elul', 7: 'Tishri', 8: 'Heshvan', 9: 'Kislev', 10: 'Tevet', 11: 'Shevat', 12: 'Adar', 13: 'Adar II' }
const hebrewMonthName = (y: number, m: number) => (m === 12 && isHebrewLeap(y) ? 'Adar I' : HEBREW_NAMES[m])
const COPTIC_MONTHS = ['Thout', 'Paopi', 'Hathor', 'Koiak', 'Tobi', 'Meshir', 'Paremhat', 'Parmouti', 'Pashons', 'Paoni', 'Epip', 'Mesori', 'Pi Kogi Enavot']
const ETHIOPIC_MONTHS = ['Meskerem', 'Tekemt', 'Hedar', 'Tahsas', 'Ter', 'Yekatit', 'Megabit', 'Miazia', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume']
const SAKA_MONTHS = ['Chaitra', 'Vaisakha', 'Jyaistha', 'Asadha', 'Sravana', 'Bhadra', 'Asvina', 'Kartika', 'Agrahayana', 'Pausa', 'Magha', 'Phalguna']

const yearWithEra = (y: number, after: string, before: string) => (y >= 1 ? `${y} ${after}` : `${1 - y} ${before}`)

/** Fixed day → epoch ms at 12:00 UTC (for Intl formatting). */
export const fixedToEpochMs = (date: number) => (date - 719163) * 86_400_000 + 43_200_000

/** Format via Intl. `from`/`to` (Gregorian dates) limit where the browser's data is meaningful. */
function intlFormat(calendar: string, range: { from?: [number, number, number]; to?: [number, number, number] } = {}) {
  const lo = range.from ? fixedFromGregorian({ year: range.from[0], month: range.from[1], day: range.from[2] }) : -Infinity
  const hi = range.to ? fixedFromGregorian({ year: range.to[0], month: range.to[1], day: range.to[2] }) : Infinity
  return (date: number) => {
    if (date < lo) return 'Before this calendar’s epoch'
    if (date > hi) return 'Outside the published range'
    if (Math.abs(fixedToEpochMs(date)) > 8.64e15) return 'Beyond the range browsers support (±275,000 years)'
    try {
      return new Intl.DateTimeFormat('en', { calendar, timeZone: 'UTC', dateStyle: 'long' }).format(fixedToEpochMs(date))
    } catch {
      return 'Not available in this browser'
    }
  }
}

export const calendars: CalendarSystem[] = [
  {
    id: 'gregorian', name: 'Gregorian', kind: 'exact', usesEra: true,
    note: 'Proleptic: extended backwards before its 1582 introduction.',
    months: simple(GREG_MONTHS), daysInMonth: gregorianDaysInMonth,
    toFixed: fixedFromGregorian, fromFixed: gregorianFromFixed,
    format: (d, n) => fmtEra(gregorianFromFixed(d), GREG_MONTHS, n),
  },
  {
    id: 'julian', name: 'Julian', kind: 'exact', usesEra: true,
    note: 'Used in Europe until 1582 (later in many countries).',
    months: simple(GREG_MONTHS), daysInMonth: julianDaysInMonth,
    toFixed: fixedFromJulian, fromFixed: julianFromFixed,
    format: (d, n) => fmtEra(julianFromFixed(d), GREG_MONTHS, n),
  },
  {
    id: 'islamic', name: 'Islamic (Hijri, tabular)', kind: 'exact',
    note: 'Arithmetic calendar; observed dates can differ by a day or two.',
    months: simple(ISLAMIC_MONTHS), daysInMonth: islamicDaysInMonth,
    toFixed: fixedFromIslamic, fromFixed: islamicFromFixed,
    format: (d) => { const x = islamicFromFixed(d); return `${x.day} ${ISLAMIC_MONTHS[x.month - 1]} ${yearWithEra(x.year, 'AH', 'BH')}` },
  },
  {
    id: 'hebrew', name: 'Hebrew', kind: 'exact',
    months: (y) => hebrewMonthOrder(y).map((m) => ({ value: m, label: hebrewMonthName(y, m) })),
    daysInMonth: hebrewDaysInMonth, toFixed: fixedFromHebrew, fromFixed: hebrewFromFixed,
    format: (d) => { const x = hebrewFromFixed(d); return `${x.day} ${hebrewMonthName(x.year, x.month)} ${x.year} AM` },
  },
  {
    id: 'buddhist', name: 'Buddhist (Thai solar)', kind: 'exact',
    note: 'Gregorian months with years counted from 543 BC.',
    months: simple(GREG_MONTHS), daysInMonth: (y, m) => gregorianDaysInMonth(y - BUDDHIST_OFFSET, m),
    toFixed: (d) => fixedFromGregorian({ ...d, year: d.year - BUDDHIST_OFFSET }),
    fromFixed: (date) => { const g = gregorianFromFixed(date); return { ...g, year: g.year + BUDDHIST_OFFSET } },
    format: (d) => { const g = gregorianFromFixed(d); return `${g.day} ${GREG_MONTHS[g.month - 1]} ${g.year + BUDDHIST_OFFSET} BE` },
  },
  {
    id: 'indian', name: 'Indian national (Saka)', kind: 'exact',
    months: simple(SAKA_MONTHS), daysInMonth: sakaDaysInMonth, toFixed: fixedFromSaka, fromFixed: sakaFromFixed,
    format: (d) => { const x = sakaFromFixed(d); return `${x.day} ${SAKA_MONTHS[x.month - 1]} ${x.year} Saka` },
  },
  {
    id: 'coptic', name: 'Coptic', kind: 'exact',
    months: simple(COPTIC_MONTHS), daysInMonth: copticDaysInMonth, toFixed: fixedFromCoptic, fromFixed: copticFromFixed,
    format: (d) => { const x = copticFromFixed(d); return `${x.day} ${COPTIC_MONTHS[x.month - 1]} ${yearWithEra(x.year, 'AM', 'BAM')}` },
  },
  {
    id: 'ethiopic', name: 'Ethiopian', kind: 'exact',
    months: simple(ETHIOPIC_MONTHS), daysInMonth: ethiopicDaysInMonth, toFixed: fixedFromEthiopic, fromFixed: ethiopicFromFixed,
    format: (d) => { const x = ethiopicFromFixed(d); return `${x.day} ${ETHIOPIC_MONTHS[x.month - 1]} ${yearWithEra(x.year, 'EC', 'BEC')}` },
  },
  { id: 'persian', name: 'Persian (Solar Hijri)', kind: 'display', note: 'Shown using your browser’s calendar data.', format: intlFormat('persian', { from: [622, 3, 22] }) },
  { id: 'chinese', name: 'Chinese (lunisolar)', kind: 'display', note: 'Shown using your browser’s calendar data.', format: intlFormat('chinese') },
  { id: 'islamic-umalqura', name: 'Islamic (Umm al-Qura)', kind: 'display', note: 'Saudi official calendar (published for 1900–2077), via your browser’s calendar data.', format: intlFormat('islamic-umalqura', { from: [1900, 4, 30], to: [2077, 11, 16] }) },
  { id: 'japanese', name: 'Japanese era', kind: 'display', note: 'Imperial eras from 645 AD. Before 1873 Japan used a lunisolar calendar; dates shown use Gregorian months.', format: intlFormat('japanese', { from: [645, 7, 20] }) },
]

export const inputCalendars = calendars.filter((c) => c.kind === 'exact')
export const getCalendar = (id: string) => calendars.find((c) => c.id === id)
/** Calendars usable for input; unknown or display-only ids fall back to Gregorian. */
export const getInputCalendar = (id: string) => inputCalendars.find((c) => c.id === id) ?? inputCalendars[0]

export function weekday(date: number) {
  return WEEKDAYS[dayOfWeek(date)]
}

/** Clamp a date to valid ranges for the calendar (e.g. 31 Feb → 28/29 Feb). */
export function normalize(cal: CalendarSystem, d: YMD): YMD {
  const months = cal.months!(d.year).map((m) => m.value)
  let month = d.month
  // Hebrew Adar II (13) only exists in leap years: fall back to Adar (12), not to the first month.
  if (cal.id === 'hebrew' && month === 13 && !months.includes(13)) month = 12
  if (!months.includes(month)) month = months[0]
  const day = Number.isFinite(d.day) ? Math.min(Math.max(1, Math.trunc(d.day)), cal.daysInMonth!(d.year, month)) : 1
  return { year: d.year, month, day }
}
