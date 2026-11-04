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

/** Parse user input like "1,234.5" or "1e3". Returns NaN for invalid input. */
export function parseNumber(input: string): number {
  const s = input.replace(/[,\s_]/g, '')
  if (s === '' || s === '-' || s === '.') return NaN
  return Number(s)
}
