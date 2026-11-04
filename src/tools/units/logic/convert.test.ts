import { describe, expect, it } from 'vitest'
import { categories } from '../data/units'
import { convert, parseNumber } from './convert'

const cat = (id: string) => categories.find((c) => c.id === id)!

describe('unit conversion', () => {
  it('cm → m', () => expect(convert(150, cat('length'), 'cm', 'm')).toBeCloseTo(1.5))
  it('inch → cm is exact', () => expect(convert(1, cat('length'), 'in', 'cm')).toBeCloseTo(2.54, 12))
  it('mile → km', () => expect(convert(1, cat('length'), 'mi', 'km')).toBeCloseTo(1.609344, 9))
  it('kg → lb', () => expect(convert(1, cat('mass'), 'kg', 'lb')).toBeCloseTo(2.20462262, 6))
  it('US vs UK gallon differ', () => {
    expect(convert(1, cat('volume'), 'gal_us', 'l')).toBeCloseTo(3.785411784, 9)
    expect(convert(1, cat('volume'), 'gal_uk', 'l')).toBeCloseTo(4.54609, 9)
  })
  it('temperature offsets', () => {
    expect(convert(0, cat('temperature'), 'c', 'f')).toBeCloseTo(32)
    expect(convert(100, cat('temperature'), 'c', 'f')).toBeCloseTo(212)
    expect(convert(-40, cat('temperature'), 'f', 'c')).toBeCloseTo(-40)
    expect(convert(0, cat('temperature'), 'k', 'c')).toBeCloseTo(-273.15)
  })
  it('GB vs GiB', () => expect(convert(1, cat('data'), 'GiB', 'GB')).toBeCloseTo(1.073741824, 9))
  it('every unit round-trips through base', () => {
    for (const c of categories)
      for (const u of c.units) expect(u.fromBase(u.toBase(12.345))).toBeCloseTo(12.345, 9)
  })
  it('defaults reference real units', () => {
    for (const c of categories) {
      expect(c.units.some((u) => u.id === c.defaultFrom)).toBe(true)
      expect(c.units.some((u) => u.id === c.defaultTo)).toBe(true)
    }
  })
  it('parses user input', () => {
    expect(parseNumber('1,234.5')).toBe(1234.5)
    expect(parseNumber('1e3')).toBe(1000)
    expect(parseNumber('abc')).toBeNaN()
    expect(parseNumber('')).toBeNaN()
  })
})
