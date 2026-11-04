/** Conversions between era notations and astronomical year numbering. */
export type Era = 'AD' | 'BC'
export type Notation = 'ADBC' | 'CEBCE'

/** There is no year 0 in AD/BC: 1 BC is followed directly by AD 1. */
export function toAstronomical(year: number, era: Era): number {
  if (!Number.isInteger(year) || year < 1) throw new RangeError('Era years start at 1')
  return era === 'AD' ? year : 1 - year
}

export function fromAstronomical(astro: number): { year: number; era: Era } {
  return astro >= 1 ? { year: astro, era: 'AD' } : { year: 1 - astro, era: 'BC' }
}

export function eraLabel(era: Era, notation: Notation): string {
  if (notation === 'CEBCE') return era === 'AD' ? 'CE' : 'BCE'
  return era
}

export function formatEraYear(astro: number, notation: Notation): string {
  const { year, era } = fromAstronomical(astro)
  if (notation === 'ADBC' && era === 'AD') return `AD ${year}`
  return `${year} ${eraLabel(era, notation)}`
}

/** ISO 8601 year: 4+ digits, sign for years outside 0000–9999. */
export function isoYear(astro: number): string {
  if (astro >= 0 && astro <= 9999) return String(astro).padStart(4, '0')
  return (astro < 0 ? '-' : '+') + String(Math.abs(astro)).padStart(6, '0')
}
