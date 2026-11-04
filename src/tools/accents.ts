/** Per-tool accent colours. Literal class strings so Tailwind can find them at build time. */
export type ToolAccent = 'indigo' | 'amber' | 'emerald' | 'sky' | 'rose'

export const accentClasses: Record<ToolAccent, { badge: string; ring: string; text: string; glow: string }> = {
  indigo: {
    badge: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-300',
    ring: 'hover:border-indigo-400/60',
    text: 'text-indigo-600 dark:text-indigo-300',
    glow: 'from-indigo-500/15',
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-300',
    ring: 'hover:border-amber-400/60',
    text: 'text-amber-700 dark:text-amber-300',
    glow: 'from-amber-500/15',
  },
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300',
    ring: 'hover:border-emerald-400/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    glow: 'from-emerald-500/15',
  },
  sky: {
    badge: 'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-300',
    ring: 'hover:border-sky-400/60',
    text: 'text-sky-700 dark:text-sky-300',
    glow: 'from-sky-500/15',
  },
  rose: {
    badge: 'bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-300',
    ring: 'hover:border-rose-400/60',
    text: 'text-rose-700 dark:text-rose-300',
    glow: 'from-rose-500/15',
  },
}
