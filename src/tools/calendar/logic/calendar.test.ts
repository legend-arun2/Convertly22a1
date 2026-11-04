import { describe, expect, it } from 'vitest'
import { fixedFromGregorian, fixedFromJulian, gregorianFromFixed, julianFromFixed, dayOfWeek, jdnFromFixed } from './gregorianJulian'
import { toAstronomical, fromAstronomical, formatEraYear, isoYear } from './era'
import { calendars } from './calendars'
import { hebrewFromFixed, islamicFromFixed, copticFromFixed, ethiopicFromFixed, sakaFromFixed } from './otherCalendars'

const g = (year: number, month: number, day: number) => fixedFromGregorian({ year, month, day })

describe('era notation', () => {
  it('has no year 0: 1 BC is followed by AD 1', () => {
    expect(toAstronomical(1, 'BC')).toBe(0)
    expect(toAstronomical(1, 'AD')).toBe(1)
    expect(toAstronomical(500, 'BC')).toBe(-499)
    // 31 Dec 1 BC and 1 Jan AD 1 are consecutive days
    expect(g(1, 1, 1) - g(0, 12, 31)).toBe(1)
  })
  it('round-trips', () => {
    for (const y of [-3000, -1, 0, 1, 2026]) {
      const { year, era } = fromAstronomical(y)
      expect(toAstronomical(year, era)).toBe(y)
    }
  })
  it('formats', () => {
    expect(formatEraYear(-43, 'ADBC')).toBe('44 BC')
    expect(formatEraYear(-43, 'CEBCE')).toBe('44 BCE')
    expect(formatEraYear(2026, 'ADBC')).toBe('AD 2026')
    expect(isoYear(-499)).toBe('-000499')
    expect(isoYear(33)).toBe('0033')
  })
  it('rejects year 0 input', () => expect(() => toAstronomical(0, 'AD')).toThrow())
})

describe('Gregorian & Julian', () => {
  it('R.D. 1 is 1 Jan AD 1 (Gregorian)', () => expect(g(1, 1, 1)).toBe(1))
  it('1970-01-01 is R.D. 719163, a Thursday, JDN 2440588', () => {
    expect(g(1970, 1, 1)).toBe(719163)
    expect(dayOfWeek(719163)).toBe(4)
    expect(jdnFromFixed(719163)).toBe(2440588)
  })
  it('Julian 4 Oct 1582 is followed by Gregorian 15 Oct 1582', () => {
    expect(fixedFromJulian({ year: 1582, month: 10, day: 4 }) + 1).toBe(g(1582, 10, 15))
  })
  it('Ides of March 44 BC (Julian) is 13 March 44 BC proleptic Gregorian', () => {
    const d = fixedFromJulian({ year: -43, month: 3, day: 15 })
    expect(gregorianFromFixed(d)).toEqual({ year: -43, month: 3, day: 13 })
  })
  it('round-trips across a wide range', () => {
    for (let d = g(-5000, 1, 1); d < g(3000, 1, 1); d += 997) {
      const gr = gregorianFromFixed(d)
      expect(g(gr.year, gr.month, gr.day)).toBe(d)
      expect(fixedFromJulian(julianFromFixed(d))).toBe(d)
    }
  })
})

describe('other calendars', () => {
  it('known reference dates', () => {
    // 1 Muharram 1446 AH (tabular/civil, matches ICU islamic-civil) = 8 July 2024
    expect(islamicFromFixed(g(2024, 7, 8))).toEqual({ year: 1446, month: 1, day: 1 })
    // Rosh Hashanah 5785 = 3 Oct 2024 (1 Tishri)
    expect(hebrewFromFixed(g(2024, 10, 3))).toEqual({ year: 5785, month: 7, day: 1 })
    // Passover 5784: 15 Nisan = 23 April 2024
    expect(hebrewFromFixed(g(2024, 4, 23))).toEqual({ year: 5784, month: 1, day: 15 })
    // Ethiopian New Year 2017 EC = 11 Sept 2024
    expect(ethiopicFromFixed(g(2024, 9, 11))).toEqual({ year: 2017, month: 1, day: 1 })
    // Coptic New Year 1741 AM = 11 Sept 2024
    expect(copticFromFixed(g(2024, 9, 11))).toEqual({ year: 1741, month: 1, day: 1 })
    // Indian national: 1 Chaitra 1946 = 21 March 2024 (leap year)
    expect(sakaFromFixed(g(2024, 3, 21))).toEqual({ year: 1946, month: 1, day: 1 })
  })
  it('every exact calendar round-trips', () => {
    for (const cal of calendars.filter((c) => c.kind === 'exact')) {
      for (let d = g(-1000, 1, 1); d < g(2500, 1, 1); d += 211) {
        expect(cal.toFixed!(cal.fromFixed!(d)), cal.id).toBe(d)
      }
    }
  })
  it('month lists and lengths are consistent', () => {
    for (const cal of calendars.filter((c) => c.kind === 'exact')) {
      const ymd = cal.fromFixed!(g(2024, 6, 1))
      for (const m of cal.months!(ymd.year)) {
        const first = cal.toFixed!({ year: ymd.year, month: m.value, day: 1 })
        const last = cal.toFixed!({ year: ymd.year, month: m.value, day: cal.daysInMonth!(ymd.year, m.value) })
        expect(cal.fromFixed!(last + 1).day, `${cal.id} ${m.label}`).toBe(1)
        expect(last - first + 1).toBe(cal.daysInMonth!(ymd.year, m.value))
      }
    }
  })
})
