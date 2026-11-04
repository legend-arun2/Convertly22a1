import type { Category, Unit } from './types'

/** A unit defined by a constant factor to the category's base unit. */
export function linear(id: string, name: string, symbol: string, group: string, factor: number): Unit {
  return { id, name, symbol, group, toBase: (v) => v * factor, fromBase: (v) => v / factor }
}

export function findUnit(cat: Category, id: string): Unit | undefined {
  return cat.units.find((u) => u.id === id)
}

export function convert(value: number, cat: Category, fromId: string, toId: string): number {
  const from = findUnit(cat, fromId)
  const to = findUnit(cat, toId)
  if (!from || !to) throw new Error(`Unknown unit in ${cat.id}: ${fromId} → ${toId}`)
  return to.fromBase(from.toBase(value))
}

/**
 * Parse user input. Accepts "1234.5", "1,234.5", "1e3", and the decimal comma used in much of
 * the world ("1,5" → 1.5, "1.234,5" → 1234.5). A single comma followed by exactly three digits
 * ("1,234") is read as a thousands separator. Returns NaN for invalid input.
 */
export function parseNumber(input: string): number {
  let s = input.replace(/[\s_\u00a0']/g, '')
  if (s === '' || s === '-' || s === '.' || s === ',') return NaN
  const lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    // Whichever separator comes last is the decimal point.
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (lastComma > -1) {
    const commas = s.split(',').length - 1
    const thousands = commas > 1 || /^-?\d{1,3},\d{3}$/.test(s)
    s = thousands ? s.replace(/,/g, '') : s.replace(',', '.')
  }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN
  return Number(s)
}

/** True if the value (in `fromId`) is below the category's physical minimum (e.g. absolute zero). */
export function belowMinimum(value: number, cat: Category, fromId: string): boolean {
  if (cat.minBase == null) return false
  const u = findUnit(cat, fromId)
  return !!u && u.toBase(value) < cat.minBase - 1e-9
}
