/** Human-friendly number formatting: smart precision, scientific notation for extremes. */
export function formatNumber(n: number, maxSig = 8): string {
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e15 || abs < 1e-6) {
    return n.toExponential(Math.min(maxSig - 1, 6)).replace(/\.?0+e/, 'e')
  }
  const rounded = Number(n.toPrecision(maxSig))
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 })
}
