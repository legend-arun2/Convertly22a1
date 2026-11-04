/** Human-friendly number formatting: smart precision, scientific notation for extremes. */
export function formatNumber(n: number, maxSig = 8): string {
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  // Exact integers are shown exactly (e.g. 1 TiB = 1,099,511,627,776 B), never rounded.
  if (Number.isInteger(n) && abs <= Number.MAX_SAFE_INTEGER) return n.toLocaleString('en-US')
  if (abs >= 1e15 || abs < 1e-6) {
    return n.toExponential(Math.min(maxSig - 1, 6)).replace(/\.?0+e/, 'e')
  }
  return n.toLocaleString('en-US', { maximumSignificantDigits: maxSig })
}

/** Plain, full-precision text for copying (no grouping separators). */
export function copyText(n: number): string {
  return Number.isFinite(n) ? String(Number(n.toPrecision(15))) : ''
}
