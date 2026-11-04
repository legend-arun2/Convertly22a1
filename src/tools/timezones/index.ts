import { lazy } from 'react'
import { Globe2 } from 'lucide-react'
import type { ToolDefinition } from '../types'

export const timezonesTool: ToolDefinition = {
  id: 'timezones',
  name: 'Time zones',
  description: 'Compare zones on an interactive world map with day/night, or convert a time between zones.',
  path: 'timezones',
  accent: 'indigo',
  icon: Globe2,
  keywords: ['time zone', 'timezone', 'time', 'clock', 'utc', 'gmt', 'pst', 'pdt', 'est', 'edt', 'cst', 'mst', 'ist', 'cet', 'bst', 'jst', 'aest', 'world clock', 'map', 'meeting', 'dst', 'daylight saving', 'new york', 'london', 'tokyo', 'paris', 'berlin', 'sydney', 'dubai', 'india', 'singapore', 'los angeles', 'chicago', 'toronto', 'beijing', 'shanghai', 'hong kong', 'moscow'],
  component: lazy(() => import('./TimezonesPage')),
}
