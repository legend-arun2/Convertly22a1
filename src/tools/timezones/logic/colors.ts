/** Accent colors for selected zones; readable in light and dark themes. */
export const ZONE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#84cc16']
export const colorFor = (i: number) => ZONE_COLORS[i % ZONE_COLORS.length]
