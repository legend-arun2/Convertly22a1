import { lazy } from 'react'
import { Ruler } from 'lucide-react'
import type { ToolDefinition } from '../types'

export const unitsTool: ToolDefinition = {
  id: 'units',
  name: 'Units',
  description: 'Length, mass, volume, temperature and more. Compare metric with imperial and US units.',
  path: 'units',
  icon: Ruler,
  keywords: ['cm to m', 'unit', 'length', 'distance', 'weight', 'mass', 'volume', 'temperature', 'speed', 'area', 'pressure', 'energy', 'data', 'meter', 'metre', 'mm', 'cm', 'km', 'inch', 'foot', 'feet', 'yard', 'mile', 'kg', 'gram', 'lb', 'pound', 'ounce', 'oz', 'stone', 'ton', 'celsius', 'fahrenheit', 'kelvin', '°c', '°f', 'metric', 'imperial', 'liter', 'litre', 'ml', 'gallon', 'cup', 'pint', 'mph', 'km/h', 'knot', 'acre', 'hectare', 'psi', 'bar', 'calorie', 'joule', 'kwh', 'byte', 'gb', 'mb', 'gib'],
  component: lazy(() => import('./UnitsPage')),
}
