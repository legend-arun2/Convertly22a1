import { lazy } from 'react'
import { Globe2 } from 'lucide-react'
import type { ToolDefinition } from '../types'

export const timezonesTool: ToolDefinition = {
  id: 'timezones',
  name: 'Time zones',
  description: 'Compare zones on an interactive world map with day/night, or convert a time between zones.',
  path: 'timezones',
  icon: Globe2,
  keywords: ['time zone', 'timezone', 'utc', 'gmt', 'pst', 'est', 'ist', 'cet', 'world clock', 'map', 'meeting'],
  component: lazy(() => import('./TimezonesPage')),
}
