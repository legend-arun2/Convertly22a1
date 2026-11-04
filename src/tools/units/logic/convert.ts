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

export const MAX_NUMBER_INPUT = 100

const THOUSANDS = { ',': /^\d{1,3}(?:,\d{3})+$/, '.': /^\d{1,3}(?:\.\d{3})+$/ }
// Linear-time (no nested or overlapping quantifiers), so long inputs cannot cause ReDoS.
const PLAIN_NUMBER = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i

/**
 * Parse user input. Accepts "1234.5", "1,234.5", "1e3", "−5" (U+2212), and the decimal comma used
 * in much of the world ("1,5" → 1.5, "1.234,5" → 1234.5, "1.234.567" → 1234567). A single comma
 * followed by exactly three digits ("1,234") is a thousands separator. Thousands groups must have
 * exactly three digits. Returns NaN for invalid, over-long or non-finite input.
 */
export function parseNumber(input: string): number {
  if (input.length > MAX_NUMBER_INPUT) return NaN
  let s = input.replace(/[\s_\u00a0']/g, '').replace(/\u2212/g, '-')
  const m = /^([-+]?)([\d.,]*)((?:e[-+]?\d+)?)$/i.exec(s)
  if (!m) return NaN
  const [, sign, body, exp] = m
  const commas = body.split(',').length - 1, dots = body.split('.').length - 1
  let int = body, frac = ''
  if (commas && dots) {
    // Whichever separator comes last is the decimal point; the other groups thousands.
    const dec = body.lastIndexOf(',') > body.lastIndexOf('.') ? ',' : '.'
    const grp = dec === ',' ? '.' : ','
    if ((dec === ',' ? commas : dots) > 1) return NaN
    ;[int, frac] = body.split(dec)
    if (!THOUSANDS[grp].test(int)) return NaN
    int = int.split(grp).join('')
  } else if (commas || dots) {
    const sep = commas ? ',' : '.'
    const count = commas || dots
    const isThousands = count > 1 || (sep === ',' && /^\d{1,3},\d{3}$/.test(body))
    if (isThousands) {
      if (!THOUSANDS[sep].test(body)) return NaN
      int = body.split(sep).join('')
    } else {
      ;[int, frac] = body.split(sep)
    }
  }
  s = sign + int + (frac !== undefined && (frac !== '' || /[.,]$/.test(body)) ? '.' + frac : '') + exp
  if (!PLAIN_NUMBER.test(s)) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

/** True if the value (in `fromId`) is below the category's physical minimum (e.g. absolute zero). */
export function belowMinimum(value: number, cat: Category, fromId: string): boolean {
  if (cat.minBase == null) return false
  const u = findUnit(cat, fromId)
  return !!u && u.toBase(value) < cat.minBase - 1e-9
}
