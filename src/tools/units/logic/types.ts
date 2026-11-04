export interface Unit {
  id: string
  name: string
  symbol: string
  /** Display group, e.g. "Metric", "Imperial", "US customary". */
  group: string
  toBase: (v: number) => number
  fromBase: (v: number) => number
}

export interface Category {
  id: string
  name: string
  baseUnit: string
  defaultFrom: string
  defaultTo: string
  units: Unit[]
}
