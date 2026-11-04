/** Regression tests for issues found in code review and security review. */
import { describe, expect, it } from 'vitest'
import { parseNumber, belowMinimum } from './tools/units/logic/convert'
import { categories } from './tools/units/data/units'
import { formatNumber } from './lib/format'
import { utcMs } from './lib/dates'
import { offsetMinutes, wallTimeToEpoch, dayShift, zonedParts } from './tools/timezones/logic/tz'
import { parseDateTime } from './tools/timezones/logic/parse'
import { canonicalZone, cleanZones, allZoneIds } from './tools/timezones/data/catalog'
import { getInputCalendar, normalize, calendars } from './tools/calendar/logic/calendars'
import { fixedFromGregorian } from './tools/calendar/logic/gregorianJulian'
import { isBoolean, isStringArray } from './services/storage'

const temp = categories.find((c) => c.id === 'temperature')!

describe('units', () => {
  it('reads decimal commas and thousands separators', () => {
    expect(parseNumber('1,5')).toBe(1.5)
    expect(parseNumber('1,234')).toBe(1234)
    expect(parseNumber('1,234,567')).toBe(1234567)
    expect(parseNumber('1.234,5')).toBe(1234.5)
    expect(parseNumber('1,234.5')).toBe(1234.5)
    expect(parseNumber('-0,25')).toBe(-0.25)
    expect(parseNumber('12abc')).toBeNaN()
    expect(parseNumber('1e-3')).toBe(0.001)
  })
  it('rejects temperatures below absolute zero', () => {
    expect(belowMinimum(-300, temp, 'c')).toBe(true)
    expect(belowMinimum(-273.15, temp, 'c')).toBe(false)
    expect(belowMinimum(-460, temp, 'f')).toBe(true)
    expect(belowMinimum(-1, temp, 'k')).toBe(true)
  })
  it('keeps significant digits for small numbers', () => {
    expect(formatNumber(1.2345678e-5)).toBe('0.000012345678')
  })
})

describe('years 0–99 are not treated as 1900–1999', () => {
  it('utcMs', () => {
    expect(new Date(utcMs(50, 3, 1)).getUTCFullYear()).toBe(50)
    expect(new Date(utcMs(0, 1, 1)).getUTCFullYear()).toBe(0)
  })
  it('time zone math in year 50', () => {
    expect(offsetMinutes('UTC', utcMs(50, 3, 1, 12))).toBe(0)
    expect(zonedParts('UTC', wallTimeToEpoch('UTC', 50, 3, 1, 12, 0)).year).toBe(50)
  })
})

describe('convert input validation', () => {
  it('rejects out-of-range values', () => {
    expect(parseDateTime('2026-13-01', '10:00')).toBeNull()
    expect(parseDateTime('2026-02-30', '10:00')).toBeNull()
    expect(parseDateTime('2026-01-01', '25:00')).toBeNull()
    expect(parseDateTime('275761-01-01', '00:00')).toBeNull()
    expect(parseDateTime('', '')).toBeNull()
    expect(parseDateTime('2024-02-29', '23:59')).toEqual({ y: 2024, mo: 2, d: 29, h: 23, mi: 59 })
    expect(parseDateTime('0050-03-01', '12:00')).toEqual({ y: 50, mo: 3, d: 1, h: 12, mi: 0 })
  })
  it('day shift can be two days', () => {
    expect(dayShift('Pacific/Kiritimati', 'Pacific/Pago_Pago', Date.parse('2026-06-01T10:30:00Z'))).toBe(2)
  })
})

describe('zone names', () => {
  it('maps legacy names to the map data names', () => {
    expect(canonicalZone('Asia/Calcutta')).toBe('Asia/Kolkata')
    expect(canonicalZone('Asia/Kolkata')).toBe('Asia/Kolkata')
    expect(cleanZones(['Asia/Calcutta', 'Asia/Kolkata', 'Not/AZone'])).toEqual(['Asia/Kolkata'])
  })
  it('search list has no duplicates of the same zone', () => {
    const ids = allZoneIds()
    expect(ids).toContain('Asia/Kolkata')
    expect(ids).not.toContain('Asia/Calcutta')
  })
})

describe('calendar input', () => {
  it('display-only or unknown calendar ids fall back to Gregorian', () => {
    for (const id of ['chinese', 'persian', 'japanese', 'islamic-umalqura', '__proto__', '']) {
      expect(getInputCalendar(id).id).toBe('gregorian')
    }
  })
  it('Adar II falls back to Adar in a non-leap year', () => {
    const hebrew = getInputCalendar('hebrew')
    expect(normalize(hebrew, { year: 5785, month: 13, day: 10 }).month).toBe(12) // 5785 is not leap
    expect(normalize(hebrew, { year: 5784, month: 13, day: 10 }).month).toBe(13) // 5784 is leap
  })
  it('NaN day becomes 1', () => {
    expect(normalize(getInputCalendar('gregorian'), { year: 2026, month: 2, day: NaN }).day).toBe(1)
  })
  it('huge years show a clear message in display calendars', () => {
    const persian = calendars.find((c) => c.id === 'persian')!
    expect(persian.format(fixedFromGregorian({ year: 900000, month: 1, day: 1 }), 'ADBC')).toMatch(/Beyond the range/)
  })
})

describe('storage validators', () => {
  it('reject tampered values', () => {
    const zones = isStringArray(50)
    expect(zones(['Europe/London'])).toBe(true)
    expect(zones({ a: 1 })).toBe(false)
    expect(zones('Europe/London')).toBe(false)
    expect(zones(null)).toBe(false)
    expect(zones([1])).toBe(false)
    expect(zones(Array(51).fill('UTC'))).toBe(false)
    expect(isBoolean('yes')).toBe(false)
  })
})

// ---------- Round 2 ----------
import { copyText } from './lib/format'
import { searchTools } from './tools/registry'
import { MAX_YEAR } from './tools/timezones/logic/parse'

describe('round 2: number parsing', () => {
  it('handles edge cases strictly', () => {
    const cases: [string, number][] = [
      ['1,234,5', NaN], ['1.234.567', 1234567], ['1.234.567,89', 1234567.89], ['1,000e3', 1e6],
      ['−5', -5], ['1e400', NaN], ['+5', 5], ['.5', 0.5], ['5.', 5], ['1e', NaN], ['-', NaN],
      ['1,2345', 1.2345], ['1,23,456', NaN], ['1..2', NaN],
    ]
    for (const [input, want] of cases) {
      const got = parseNumber(input)
      if (Number.isNaN(want)) expect(got, input).toBeNaN()
      else expect(got, input).toBe(want)
    }
  })
  it('is linear-time on long hostile input (no ReDoS) and capped in length', () => {
    const t = performance.now()
    expect(parseNumber('1'.repeat(99) + 'x')).toBeNaN()
    expect(parseNumber('1'.repeat(1_000_000) + 'x')).toBeNaN()
    expect(performance.now() - t).toBeLessThan(100)
  })
})

describe('round 2: number formatting', () => {
  it('shows exact integers', () => {
    expect(formatNumber(1_099_511_627_776)).toBe('1,099,511,627,776')
    expect(formatNumber(123_456_789_012)).toBe('123,456,789,012')
    expect(formatNumber(-42)).toBe('-42')
  })
  it('copies full precision without separators', () => {
    expect(copyText(1_099_511_627_776)).toBe('1099511627776')
    expect(copyText(0.1 + 0.2)).toBe('0.3')
    expect(copyText(Infinity)).toBe('')
  })
})

describe('round 2: home search', () => {
  const ids = (q: string) => searchTools(q).map((t) => t.id)
  it('matches phrases by any meaningful word', () => {
    expect(ids('kg to lb')).toContain('units')
    expect(ids('km to miles')).toContain('units')
    expect(ids('inches')).toContain('units')
    expect(ids('Tokyo')).toContain('timezones')
    expect(ids('EST to PST')).toContain('timezones')
    expect(ids('500 BC')).toContain('calendar')
    expect(ids('zzzz')).toEqual([])
    expect(ids('')).toHaveLength(3)
  })
})

describe('round 2: convert year limit', () => {
  it('accepts up to MAX_YEAR and every accepted date converts', () => {
    const p = parseDateTime(`${MAX_YEAR}-12-31`, '23:59')!
    expect(p).not.toBeNull()
    expect(Number.isFinite(wallTimeToEpoch('Pacific/Kiritimati', p.y, p.mo, p.d, p.h, p.mi))).toBe(true)
    expect(parseDateTime(`${MAX_YEAR + 1}-01-01`, '00:00')).toBeNull()
  })
  it('canonicalises a lowercase or legacy "from" zone', () => {
    expect(canonicalZone('Asia/Calcutta')).toBe('Asia/Kolkata')
  })
})
