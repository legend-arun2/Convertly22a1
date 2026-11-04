import { useMemo, useRef } from 'react'
import { cn } from '../../../lib/cn'
import { zonedParts } from '../logic/tz'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function tone(hour: number) {
  if (hour >= 9 && hour < 17) return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 22)) return 'bg-amber-400/15 text-amber-800 dark:text-amber-200'
  return 'bg-slate-500/10 text-slate-600 dark:text-slate-300' // ≥ 4.5:1 contrast in both themes
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * One-hour cells covering the home zone's local day (23 or 25 on clock-change days);
 * shows this zone's local time in each.
 */
export function ZoneStrip({ zone, dayStart, hours, cursorIndex, onPick }: { zone: string; dayStart: number; hours: number; cursorIndex: number; onPick: (i: number) => void }) {
  const cells = useMemo(
    () => Array.from({ length: hours }, (_, i) => zonedParts(zone, dayStart + i * 3_600_000)),
    [zone, dayStart, hours],
  )
  const groupRef = useRef<HTMLDivElement>(null)
  // One tab stop per strip (the current hour); arrow keys move between hours.
  const move = (to: number) => {
    const i = Math.max(0, Math.min(hours - 1, to))
    onPick(i)
    ;(groupRef.current?.children[i] as HTMLElement | undefined)?.focus()
  }
  const active = Math.max(0, Math.min(hours - 1, cursorIndex))
  return (
    <div ref={groupRef} className="flex min-w-0 flex-1 gap-px" role="group" aria-label={`Hours in ${zone}`}>
      {cells.map((p, i) => (
        <button
          key={i}
          type="button"
          tabIndex={i === active ? 0 : -1}
          onClick={() => onPick(i)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); move(i + 1) }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); move(i - 1) }
            else if (e.key === 'Home') { e.preventDefault(); move(0) }
            else if (e.key === 'End') { e.preventDefault(); move(hours - 1) }
          }}
          aria-label={`${DAYS[p.weekday]} ${pad(p.hour)}:${pad(p.minute)} in ${zone}`}
          aria-current={i === cursorIndex ? 'time' : undefined}
          title={`${DAYS[p.weekday]} ${pad(p.hour)}:${pad(p.minute)}`}
          className={cn(
            'relative flex h-9 min-w-0 flex-1 flex-col items-center justify-center rounded-[3px] text-[10px] leading-none tabular transition hover:ring-1 hover:ring-[var(--accent)] sm:text-[11px]',
            tone(p.hour),
            i === cursorIndex && 'ring-2 ring-[var(--accent)] z-[1]',
            p.hour === 0 && 'border-l-2 border-[var(--text)]/40',
          )}
        >
          {p.hour === 0 ? (
            <span className="text-[8px] font-semibold uppercase sm:text-[9px]">{DAYS[p.weekday]}</span>
          ) : (
            <span className={i % 2 ? 'hidden sm:inline' : ''}>{p.hour}</span>
          )}
          {p.minute !== 0 && <span className="hidden text-[8px] opacity-70 sm:inline">:{pad(p.minute)}</span>}
        </button>
      ))}
    </div>
  )
}
