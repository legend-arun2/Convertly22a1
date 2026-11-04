import type { ToolDefinition } from './types'
import { calendarTool } from './calendar'
import { timezonesTool } from './timezones'
import { unitsTool } from './units'

/**
 * The single list of tools. Navigation, routes, the home grid and search are all
 * generated from it. To add a feature: create src/tools/<id>/index.ts and add it here.
 */
export const tools: ToolDefinition[] = [timezonesTool, calendarTool, unitsTool]

const STOP_WORDS = new Set(['to', 'in', 'into', 'from', 'and', 'vs', 'convert', 'conversion', 'what', 'is', 'the', 'a', 'of', 'how', 'many'])

/** Matches if any meaningful word of the query matches a tool's name, description or keywords. */
export function searchTools(query: string): ToolDefinition[] {
  const tokens = query.toLowerCase().split(/[^\p{L}\p{N}°]+/u).filter((w) => w.length > 1 && !STOP_WORDS.has(w))
  if (!tokens.length) return query.trim() ? [] : tools
  return tools.filter((t) => {
    const fields = [t.name, t.description, ...t.keywords].map((s) => s.toLowerCase())
    const words = fields.flatMap((f) => f.split(/[^\p{L}\p{N}°]+/u)).filter((w) => w.length > 1)
    return tokens.some((tok) => fields.some((f) => f.includes(tok)) || words.some((w) => w.length >= 3 && tok.startsWith(w)))
  })
}
