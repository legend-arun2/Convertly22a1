// Generates src/tools/timezones/data/geo.json from tz database metadata (moment-timezone)
// and ISO country codes (world-countries). Run with: npm run gen:tz
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const meta = require('moment-timezone/data/meta/latest.json')
const world = require('world-countries')

const round = (n) => Math.round(n * 100) / 100
const zones = Object.values(meta.zones).map((z) => ({
  id: z.name,
  lat: round(z.lat),
  lon: round(z.long),
  cc: z.countries,
  note: z.comments || undefined,
}))

// Keyed by ISO numeric code (as used by world-atlas). Disputed areas without a code are keyed by name.
const countries = {}
for (const c of world) {
  // Zones whose primary country is this one come first (e.g. Germany → Berlin before Zurich/Büsingen).
  const zonesFor = [...(meta.countries[c.cca2]?.zones ?? [])].sort(
    (a, b) => Number(meta.zones[b]?.countries[0] === c.cca2) - Number(meta.zones[a]?.countries[0] === c.cca2),
  )
  if (!zonesFor.length) continue
  const key = c.ccn3 || `name:${c.name.common}`
  countries[key] = { cc: c.cca2, name: c.name.common, zones: zonesFor }
}
countries['name:Kosovo'] = { cc: 'XK', name: 'Kosovo', zones: ['Europe/Belgrade'] }
countries['name:N. Cyprus'] = { cc: 'CY', name: 'Northern Cyprus', zones: ['Asia/Famagusta'] }
countries['name:Somaliland'] = { cc: 'SO', name: 'Somaliland', zones: ['Africa/Mogadishu'] }

writeFileSync('src/tools/timezones/data/geo.json', JSON.stringify({ version: meta.version, zones, countries }))
console.log(`tz ${meta.version}: ${zones.length} zones, ${Object.keys(countries).length} countries`)
