import type { ComponentType, LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { ToolAccent } from './accents'

/** Every feature of the app is a "tool". Add one by creating a folder and registering it. */
export interface ToolDefinition {
  id: string
  name: string
  description: string
  /** Route path relative to the app base, without leading slash. */
  path: string
  icon: LucideIcon
  /** Accent colour for the tool's icon, card and page header. */
  accent: ToolAccent
  /** Extra search terms, e.g. "cm to m", "PST". */
  keywords: string[]
  component: LazyExoticComponent<ComponentType>
}
