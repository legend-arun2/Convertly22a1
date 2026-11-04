import geo from './geo.json'
import { cityName, formatOffset, isValidZone, offsetMinutes } from '../logic/tz'

export interface ZoneGeo { id: string; lat: number; lon: number; cc: string[]; note?: string }
export interface CountryInfo { cc: string; name: string; zones: string[] }

const countryByCode = new Map<string, CountryInfo>()
for (const c of Object.values(geo.countries) as CountryInfo[]) countryByCode.set(c.cc, c)

/** Zones with coordinates that this browser supports. */
export const zoneGeo: ZoneGeo[] = (geo.zones as ZoneGeo[]).filter((z) => isValidZone(z.id))
export const zoneGeoById = new Map(zoneGeo.map((z) => [z.id, z]))

/**
 * Browsers may report legacy names (Asia/Calcutta, Europe/Kiev) for zones our map data lists
 * under current names (Asia/Kolkata, Europe/Kyiv). Map every name to one canonical id.
 */
const resolvedName = (z: string) => {
  try { return new Intl.DateTimeFormat('en-US', { timeZone: z }).resolvedOptions().timeZone } catch { return z }
}
let canonicalMap: Map<string, string> | null = null
export function canonicalZone(zone: string): string {
  if (!canonicalMap) {
    canonicalMap = new Map()
    for (const z of zoneGeo) {
      canonicalMap.set(z.id, z.id)
      canonicalMap.set(resolvedName(z.id), z.id)
    }
  }
  return canonicalMap.get(zone) ?? canonicalMap.get(resolvedName(zone)) ?? zone
}

/** Canonical, valid, de-duplicated zone list (max `limit`). */
export function cleanZones(zones: string[], limit = 50): string[] {
  return [...new Set(zones.filter(isValidZone).map(canonicalZone))].slice(0, limit)
}

/** Look up a world-atlas feature (numeric ISO id, or name for disputed areas). */
export function countryForFeature(id: string | number | undefined, name: string): CountryInfo | undefined {
  const c = (id != null ? (geo.countries as Record<string, CountryInfo>)[String(id)] : undefined) ?? (geo.countries as Record<string, CountryInfo>)[`name:${name}`]
  if (!c) return undefined
  return { ...c, zones: c.zones.filter(isValidZone) }
}

export const countryName = (cc: string) => countryByCode.get(cc)?.name ?? cc

export function zoneLabel(zone: string): string {
  const g = zoneGeoById.get(zone)
  const city = cityName(zone)
  return g?.cc[0] ? `${city}, ${countryName(g.cc[0])}` : city
}

/** Common abbreviations and big cities that are not zone names. */
export const aliases: Record<string, string> = {
  PST: 'America/Los_Angeles', PDT: 'America/Los_Angeles', 'Pacific Time': 'America/Los_Angeles',
  MST: 'America/Denver', MDT: 'America/Denver', 'Mountain Time': 'America/Denver',
  CST: 'America/Chicago', CDT: 'America/Chicago', 'Central Time': 'America/Chicago',
  EST: 'America/New_York', EDT: 'America/New_York', 'Eastern Time': 'America/New_York',
  AKST: 'America/Anchorage', HST: 'Pacific/Honolulu', GMT: 'Europe/London', BST: 'Europe/London',
  CET: 'Europe/Paris', CEST: 'Europe/Paris', EET: 'Europe/Athens', MSK: 'Europe/Moscow',
  IST: 'Asia/Kolkata', PKT: 'Asia/Karachi', JST: 'Asia/Tokyo', KST: 'Asia/Seoul', SGT: 'Asia/Singapore',
  AEST: 'Australia/Sydney', AEDT: 'Australia/Sydney', AWST: 'Australia/Perth', NZST: 'Pacific/Auckland',
  'San Francisco': 'America/Los_Angeles', Seattle: 'America/Los_Angeles', Boston: 'America/New_York',
  Washington: 'America/New_York', Miami: 'America/New_York', Atlanta: 'America/New_York', Dallas: 'America/Chicago',
  Houston: 'America/Chicago', Montreal: 'America/Toronto', 'Delhi': 'Asia/Kolkata', 'New Delhi': 'Asia/Kolkata',
  Mumbai: 'Asia/Kolkata', Bangalore: 'Asia/Kolkata', Bengaluru: 'Asia/Kolkata', Chennai: 'Asia/Kolkata',
  Beijing: 'Asia/Shanghai', Shenzhen: 'Asia/Shanghai', 'Hong Kong': 'Asia/Hong_Kong', Osaka: 'Asia/Tokyo',
'Abu Dhabi': 'Asia/Dubai', Riyadh: 'Asia/Riyadh', 'Tel Aviv': 'Asia/Jerusalem',
  Barcelona: 'Europe/Madrid', Munich: 'Europe/Berlin', Frankfurt: 'Europe/Berlin', Milan: 'Europe/Rome',
  'St Petersburg': 'Europe/Moscow', Geneva: 'Europe/Zurich', Melbourne: 'Australia/Melbourne', Rio: 'America/Sao_Paulo',
  'Rio de Janeiro': 'America/Sao_Paulo', Lagos: 'Africa/Lagos', Nairobi: 'Africa/Nairobi',
  'Cape Town': 'Africa/Johannesburg', Hanoi: 'Asia/Bangkok', 'Ho Chi Minh': 'Asia/Ho_Chi_Minh',
}

export function allZoneIds(): string[] {
  let ids: string[] = []
  try {
    ids = (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone')
  } catch { /* older browser */ }
  return cleanZones([...ids, ...zoneGeo.map((z) => z.id), 'UTC'], Infinity).sort()
}

export function zoneOptions(epochMs: number) {
  const aliasByZone = new Map<string, string[]>()
  for (const [a, z] of Object.entries(aliases)) aliasByZone.set(z, [...(aliasByZone.get(z) ?? []), a])
  return allZoneIds().map((id) => {
    const g = zoneGeoById.get(id)
    const off = offsetMinutes(id, epochMs)
    return {
      value: id,
      label: zoneLabel(id),
      detail: formatOffset(off),
      search: [id, g?.note ?? '', ...(g?.cc.map(countryName) ?? []), ...(aliasByZone.get(id) ?? [])].join(' '),
    }
  })
}

/** Group a country's zones by current UTC offset, so multi-zone countries can be offered by offset. */
export function groupByOffset(zones: string[], epochMs: number) {
  const m = new Map<number, string[]>()
  for (const z of zones) {
    const o = offsetMinutes(z, epochMs)
    m.set(o, [...(m.get(o) ?? []), z])
  }
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([offset, zs]) => ({ offset, zones: zs }))
}
