import { describe, expect, it } from 'vitest'
import { dayShift, formatDiff, formatOffset, offsetMinutes, wallTimeToEpoch, zonedParts } from './tz'
import { subsolarPoint } from './solar'

const utc = (s: string) => Date.parse(s + 'Z')

describe('time zones', () => {
  it('offsets incl. DST', () => {
    expect(offsetMinutes('America/New_York', utc('2026-01-15T12:00:00'))).toBe(-300)
    expect(offsetMinutes('America/New_York', utc('2026-07-15T12:00:00'))).toBe(-240)
    expect(offsetMinutes('Asia/Kolkata', utc('2026-07-15T12:00:00'))).toBe(330)
    expect(offsetMinutes('Asia/Kathmandu', utc('2026-07-15T12:00:00'))).toBe(345)
    expect(offsetMinutes('Australia/Lord_Howe', utc('2026-01-15T12:00:00'))).toBe(660)
  })
  it('wall time → instant', () => {
    expect(wallTimeToEpoch('America/New_York', 2026, 1, 15, 12, 0)).toBe(utc('2026-01-15T17:00:00'))
    expect(wallTimeToEpoch('Asia/Kolkata', 2026, 7, 1, 9, 0)).toBe(utc('2026-07-01T03:30:00'))
  })
  it('handles the spring-forward gap (2:30 does not exist on 8 Mar 2026 in New York)', () => {
    const t = wallTimeToEpoch('America/New_York', 2026, 3, 8, 2, 30)
    expect(t).toBe(utc('2026-03-08T07:30:00')) // = 03:30 EDT
    expect(zonedParts('America/New_York', t).hour).toBe(3)
  })
  it('handles the repeated hour (1:30 on 1 Nov 2026 in New York → earlier, EDT)', () => {
    expect(wallTimeToEpoch('America/New_York', 2026, 11, 1, 1, 30)).toBe(utc('2026-11-01T05:30:00'))
  })
  it('day shift across the date line', () => {
    const t = utc('2026-06-01T22:00:00')
    expect(dayShift('Pacific/Auckland', 'America/Los_Angeles', t)).toBe(1)
  })
  it('formats', () => {
    expect(formatOffset(330)).toBe('UTC+5:30')
    expect(formatOffset(-300)).toBe('UTC−5')
    expect(formatDiff(570)).toBe('+9h 30m')
    expect(formatDiff(-60)).toBe('−1h')
  })
})

describe('solar position', () => {
  it('June solstice: sun over the Tropic of Cancer', () => {
    expect(subsolarPoint(utc('2026-06-21T12:00:00')).lat).toBeCloseTo(23.44, 0)
  })
  it('around 12:00 UTC the sun is near longitude 0', () => {
    expect(Math.abs(subsolarPoint(utc('2026-03-20T12:00:00')).lon)).toBeLessThan(3)
  })
})
