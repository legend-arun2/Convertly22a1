import type { ToolDefinition } from './types'
import { calendarTool } from './calendar'
import { timezonesTool } from './timezones'
import { unitsTool } from './units'

/**
 * The single list of tools. Navigation, routes, the home grid and search are all
 * generated from it. To add a feature: create src/tools/<id>/index.ts and add it here.
 */
export const tools: ToolDefinition[] = [timezonesTool, calendarTool, unitsTool]

export function searchTools(query: string): ToolDefinition[] {
  const q = query.trim().toLowerCase()
  if (!q) return tools
  return tools.filter((t) =>
    [t.name, t.description, ...t.keywords].some((s) => s.toLowerCase().includes(q)),
  )
}
