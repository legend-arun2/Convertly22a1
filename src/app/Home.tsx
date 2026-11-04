import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Search } from 'lucide-react'
import { searchTools } from '../tools/registry'

export function Home() {
  const [q, setQ] = useState('')
  const results = searchTools(q)
  return (
    <div className="mx-auto max-w-3xl">
      <div className="py-6 text-center sm:py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Convert anything, quickly.</h1>
        <p className="mt-3 text-[var(--muted)]">Dates across eras and calendars, time zones on a live world map, and every common unit.</p>
        <div className="relative mx-auto mt-6 max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Try "cm to m", "PST" or "BC"'
            aria-label="Search tools"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {results.map((t) => (
          <Link
            key={t.id}
            to={`/${t.path}`}
            className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)]"
          >
            <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <t.icon size={20} />
            </span>
            <span className="font-semibold">{t.name}</span>
            <span className="mt-1 flex-1 text-sm text-[var(--muted)]">{t.description}</span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)]">
              Open <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
        {results.length === 0 && <p className="col-span-full text-center text-sm text-[var(--muted)]">No tools match “{q}”.</p>}
      </div>
    </div>
  )
}
