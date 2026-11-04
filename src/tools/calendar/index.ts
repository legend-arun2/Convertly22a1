import { lazy } from 'react'
import { CalendarRange } from 'lucide-react'
import type { ToolDefinition } from '../types'

export const calendarTool: ToolDefinition = {
  id: 'calendar',
  name: 'Calendars',
  description: 'AD ↔ BC, CE ↔ BCE, and dates across Gregorian, Julian, Hijri, Hebrew and more.',
  path: 'calendar',
  icon: CalendarRange,
  keywords: ['BC', 'AD', 'BCE', 'CE', 'era', 'julian', 'gregorian', 'hijri', 'islamic', 'hebrew', 'chinese', 'persian', 'date'],
  component: lazy(() => import('./CalendarPage')),
}
