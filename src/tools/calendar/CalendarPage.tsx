import { useMemo } from 'react'
import { CalendarDays, Info } from 'lucide-react'
import { Card, CopyButton, Field, Input, PageHeader, Segmented, Select } from '../../components/ui'
import { useUrlState } from '../../lib/useUrlState'
import { calendars, getCalendar, inputCalendars, normalize, weekday } from './logic/calendars'
import { fixedFromGregorian, gregorianFromFixed, jdnFromFixed } from './logic/gregorianJulian'
import { fromAstronomical, formatEraYear, isoYear, toAstronomical, type Era, type Notation } from './logic/era'

function today() {
  const now = new Date()
  return { y: String(now.getFullYear()), m: String(now.getMonth() + 1), d: String(now.getDate()) }
}

export default function CalendarPage() {
  const t = useMemo(today, [])
  const [s, set] = useUrlState({ cal: 'gregorian', era: 'AD', y: t.y, m: t.m, d: t.d, n: 'ADBC' })
  const cal = getCalendar(s.cal) ?? inputCalendars[0]
  const notation = (s.n === 'CEBCE' ? 'CEBCE' : 'ADBC') as Notation

  // Resolve inputs to an internal (astronomical) date
  const yearNum = Number(s.y)
  const yearValid = Number.isInteger(yearNum) && (cal.usesEra ? yearNum >= 1 : true) && Math.abs(yearNum) < 1_000_000
  const astroYear = yearValid ? (cal.usesEra ? toAstronomical(yearNum, s.era as Era) : yearNum) : NaN
  const ymd = yearValid ? normalize(cal, { year: astroYear, month: Number(s.m), day: Number(s.d) }) : null
  const fixed = ymd ? cal.toFixed!(ymd) : null

  const setFromFixed = (calId: string, date: number) => {
    const c = getCalendar(calId)!
    const v = c.fromFixed!(date)
    if (c.usesEra) {
      const { year, era } = fromAstronomical(v.year)
      set({ cal: calId, era, y: String(year), m: String(v.month), d: String(v.day) })
    } else set({ cal: calId, y: String(v.year), m: String(v.month), d: String(v.day) })
  }

  const months = ymd ? cal.months!(ymd.year) : []
  const dayCount = ymd ? cal.daysInMonth!(ymd.year, ymd.month) : 31

  return (
    <div>
      <PageHeader title="Calendar & era converter" description="Convert dates between AD/BC and CE/BCE, and across Gregorian, Julian, Islamic, Hebrew and other calendars." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card
          title="Enter a date"
          actions={
            <button
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent-soft)]"
              onClick={() => setFromFixed(cal.id, fixedFromGregorian({ year: Number(t.y), month: Number(t.m), day: Number(t.d) }))}
            >
              <CalendarDays size={14} /> Today
            </button>
          }
        >
          <div className="flex flex-col gap-3">
            <Field label="Calendar">
              <Select
                value={cal.id}
                onChange={(e) => (fixed != null ? setFromFixed(e.target.value, fixed) : set({ cal: e.target.value }))}
                options={inputCalendars.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Field>
            <div className={'grid gap-3 ' + (cal.usesEra ? 'grid-cols-2 sm:grid-cols-[1fr_1fr_1.4fr_0.8fr]' : 'grid-cols-[1fr_1.4fr_0.8fr]')}>
              {cal.usesEra && (
                <Field label="Era">
                  <Select
                    value={s.era}
                    onChange={(e) => set({ era: e.target.value })}
                    options={[{ value: 'AD', label: notation === 'CEBCE' ? 'CE' : 'AD' }, { value: 'BC', label: notation === 'CEBCE' ? 'BCE' : 'BC' }]}
                  />
                </Field>
              )}
              <Field label="Year">
                <Input inputMode="numeric" value={s.y} onChange={(e) => set({ y: e.target.value.trim() })} aria-invalid={!yearValid} />
              </Field>
              <Field label="Month">
                <Select value={String(ymd?.month ?? s.m)} onChange={(e) => set({ m: e.target.value })} options={months.map((m) => ({ value: String(m.value), label: m.label }))} />
              </Field>
              <Field label="Day">
                <Select
                  value={String(ymd?.day ?? s.d)}
                  onChange={(e) => set({ d: e.target.value })}
                  options={Array.from({ length: dayCount }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                />
              </Field>
            </div>
            {!yearValid && <p className="text-sm text-red-500">{cal.usesEra ? 'Enter a whole year of 1 or more. There is no year 0 in AD/BC.' : 'Enter a whole year.'}</p>}
            {cal.note && <p className="text-xs text-[var(--muted)]">{cal.note}</p>}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
              <span className="text-xs text-[var(--muted)]">Era notation</span>
              <Segmented value={notation} onChange={(n) => set({ n })} options={[{ value: 'ADBC', label: 'AD / BC' }, { value: 'CEBCE', label: 'CE / BCE' }]} />
            </div>
          </div>
        </Card>

        {fixed != null ? <Summary fixed={fixed} notation={notation} currentYear={Number(t.y)} /> : <Card><p className="text-sm text-[var(--muted)]">Enter a valid date.</p></Card>}
      </div>

      {fixed != null && (
        <Card title="Same day in every calendar" className="mt-4">
          <ul className="divide-y divide-[var(--border)]">
            {calendars.map((c) => {
              const text = c.format(fixed, notation)
              return (
                <li key={c.id} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                  <span className="w-56 shrink-0 text-sm text-[var(--muted)]">
                    {c.name}
                    {c.note && <span title={c.note} className="ml-1 inline-flex align-middle"><Info size={12} /></span>}
                  </span>
                  <span className={'flex-1 text-sm tabular' + (c.id === cal.id ? ' font-semibold' : '')}>{text}</span>
                  <CopyButton text={text} />
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Summary({ fixed, notation, currentYear }: { fixed: number; notation: Notation; currentYear: number }) {
  const gr = gregorianFromFixed(fixed)
  const diff = currentYear - gr.year
  const iso = `${isoYear(gr.year)}-${String(gr.month).padStart(2, '0')}-${String(gr.day).padStart(2, '0')}`
  const beforeReform = fixed < fixedFromGregorian({ year: 1582, month: 10, day: 15 })
  return (
    <Card title="Result">
      <p className="text-sm text-[var(--muted)]">{weekday(fixed)}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{calendars[0].format(fixed, notation)}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {diff > 0 ? `${diff.toLocaleString()} year${diff === 1 ? '' : 's'} ago` : diff < 0 ? `in ${(-diff).toLocaleString()} year${diff === -1 ? '' : 's'}` : 'This year'}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Stat label="AD / BC" value={formatEraYear(gr.year, 'ADBC')} />
        <Stat label="CE / BCE" value={formatEraYear(gr.year, 'CEBCE')} />
        <Stat label="Astronomical year" value={String(gr.year)} hint="1 BC = 0, 2 BC = −1" />
        <Stat label="ISO 8601" value={iso} />
        <Stat label="Julian Day Number" value={jdnFromFixed(fixed).toLocaleString()} />
      </dl>
      {beforeReform && (
        <p className="mt-4 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--text)]">
          Before 15 Oct 1582 historical sources usually give dates in the <b>Julian</b> calendar. The Gregorian date shown is projected backwards (proleptic).
        </p>
      )}
    </Card>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
      <dt className="text-xs text-[var(--muted)]" title={hint}>{label}</dt>
      <dd className="mt-0.5 font-medium tabular">{value}</dd>
    </div>
  )
}
