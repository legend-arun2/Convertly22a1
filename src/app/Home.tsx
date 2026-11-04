import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, Search, Sparkles } from 'lucide-react'
import { searchTools } from '../tools/registry'
import { accentClasses } from '../tools/accents'
import { useNow } from '../lib/useNow'
import { cn } from '../lib/cn'

/** Shortcuts straight into a filled-in conversion (every tool keeps its state in the URL). */
const POPULAR: { label: string; to: string }[] = [
  { label: '180 cm in feet', to: '/units?cat=length&from=cm&to=ft&v=180' },
  { label: '70 kg in pounds', to: '/units?cat=mass&from=kg&to=lb&v=70' },
  { label: '98.6 °F in °C', to: '/units?cat=temperature&from=f&to=c&v=98.6' },
  { label: '10 litres in US gallons', to: '/units?cat=volume&from=l&to=gal_us&v=10' },
  { label: 'Ides of March, 44 BC', to: '/calendar?cal=julian&era=BC&y=44&m=3&d=15' },
  { label: 'Today in the Hijri calendar', to: '/calendar?cal=islamic' },
  { label: '9 AM Los Angeles, everywhere', to: '/timezones?view=convert&from=America/Los_Angeles&time=09:00' },
]

export function Home() {
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const results = searchTools(q)

  // "/" focuses the search, like many developer tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); inputRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="mx-auto max-w-5xl">
      <section className="pb-10 pt-4 text-center sm:pb-14 sm:pt-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted)] shadow-[var(--shadow-sm)]">
          <Sparkles size={13} className="text-[var(--accent)]" /> Free, private, no sign-up
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Convert anything, <span className="gradient-text">instantly.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Dates across eras and calendars, time zones on a live world map, and every everyday unit, all in one place.
        </p>
        <div className="relative mx-auto mt-8 max-w-lg">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Try "kg to lb", "Tokyo" or "BC"'
            aria-label="Search tools"
            className="h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] pl-12 pr-14 text-base shadow-[var(--shadow-md)] outline-none transition hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 focus-visible:outline-none"
          />
          <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 font-sans text-xs text-[var(--muted)] sm:block">/</kbd>
        </div>
      </section>

      <section aria-label="Tools" className="grid gap-4 sm:grid-cols-3">
        {results.map((t) => {
          const a = accentClasses[t.accent]
          return (
            <Link
              key={t.id}
              to={`/${t.path}`}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]',
                a.ring,
              )}
            >
              <span aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b to-transparent opacity-70', a.glow)} />
              <span className={cn('relative mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1', a.badge)}>
                <t.icon size={22} strokeWidth={1.75} />
              </span>
              <span className="relative text-lg font-semibold tracking-tight">{t.name}</span>
              <span className="relative mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{t.description}</span>
              <div className="relative mt-5 flex-1">{PREVIEWS[t.id]?.()}</div>
              <span className={cn('relative mt-5 inline-flex items-center gap-1 text-sm font-semibold', a.text)}>
                Open {t.name.toLowerCase()} <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          )
        })}
        {results.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--muted)]">
            No tools match “{q}”. Try a unit, a city or an era.
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Popular conversions</h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {POPULAR.map((p) => (
            <li key={p.to}>
              <Link
                to={p.to}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-sm shadow-[var(--shadow-sm)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {p.label} <ArrowUpRight size={13} className="opacity-60" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// ---------- Live previews (Intl only, so the home page stays light) ----------

const PREVIEWS: Record<string, () => ReactNode> = {
  timezones: () => <ClockPreview />,
  calendar: () => <CalendarPreview />,
  units: () => (
    <PreviewList
      rows={[
        ['1 inch', '2.54 cm'],
        ['1 kilogram', '2.205 lb'],
        ['0 °C', '32 °F'],
      ]}
    />
  ),
}

function PreviewList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 px-3 py-2">
          <dt className="truncate text-[var(--muted)]">{k}</dt>
          <dd className="tabular font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function ClockPreview() {
  const now = useNow(10_000)
  const fmt = (timeZone?: string) => {
    try { return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(now) } catch { return '—' }
  }
  return <PreviewList rows={[['Your time', fmt()], ['London', fmt('Europe/London')], ['Tokyo', fmt('Asia/Tokyo')]]} />
}

function CalendarPreview() {
  const now = useNow(60_000)
  const fmt = (calendar: string) => {
    try { return new Intl.DateTimeFormat('en', { calendar, day: 'numeric', month: 'short', year: 'numeric' }).format(now) } catch { return '—' }
  }
  return <PreviewList rows={[['Gregorian', fmt('gregory') + ' AD'], ['Hebrew', fmt('hebrew')], ['Hijri', fmt('islamic-civil')]]} />
}
