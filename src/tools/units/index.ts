import { lazy } from 'react'
import { Ruler } from 'lucide-react'
import type { ToolDefinition } from '../types'

export const unitsTool: ToolDefinition = {
  id: 'units',
  name: 'Units',
  description: 'Length, mass, volume, temperature and more. Compare metric with imperial and US units.',
  path: 'units',
  icon: Ruler,
  keywords: ['cm to m', 'meter', 'inch', 'feet', 'kg', 'pound', 'celsius', 'fahrenheit', 'metric', 'imperial', 'liter', 'gallon', 'mph'],
  component: lazy(() => import('./UnitsPage')),
}
