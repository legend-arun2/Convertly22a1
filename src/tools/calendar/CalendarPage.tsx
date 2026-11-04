import { CalendarDays, Info } from 'lucide-react'
import { Card, CopyButton, Field, Input, PageHeader, Segmented, Select } from '../../components/ui'
import { useUrlState } from '../../lib/useUrlState'
import { useNow } from '../../lib/useNow'
import { calendars, getInputCalendar, inputCalendars, normalize, weekday } from './logic/calendars'
import { fixedFromGregorian, gregorianFromFixed, jdnFromFixed } from './logic/gregorianJulian'
import { fromAstronomical, formatEraYear, isoYear, toAstronomical, type Era, type Notation } from './logic/era'

function today() {
  const now = new Date()
  return { y: String(now.getFullYear()), m: String(now.getMonth() + 1), d: String(now.getDate()) }
}

export default function CalendarPage() {
  // Empty defaults mean "today" (resolved at render), so shared links always carry the full date
  // the sender picked, and an untouched page never shows a stale day after midnight.
  useNow(60_000) // re-render each minute so an untouched "today" rolls over at midnight
  const t = today()
  const [s, set] = useUrlState({ cal: 'gregorian', era: 'AD', y: '', m: '', d: '', n: 'ADBC' })
  const cal = getInputCalendar(s.cal)
  const notation = (s.n === 'CEBCE' ? 'CEBCE' : 'ADBC') as Notation
  const era: Era = s.era === 'BC' ? 'BC' : 'AD'
  const usingToday = s.y === '' && s.m === '' && s.d === ''

  // Resolve inputs to an internal (astronomical) date
  let yearStr = s.y, monthNum = Number(s.m), dayNum = Number(s.d), inputEra = era
  if (usingToday) {
    const v = cal.fromFixed!(fixedFromGregorian({ year: Number(t.y), month: Number(t.m), day: Number(t.d) }))
    const e = fromAstronomical(v.year)
    yearStr = String(cal.usesEra ? e.year : v.year)
    inputEra = e.era
    monthNum = v.month
    dayNum = v.day
  }
  // Plain decimal digits only (Number() would also accept "1e3" or "0x10").
  const yearNum = (cal.usesEra ? /^\d{1,6}$/ : /^-?\d{1,6}$/).test(yearStr.trim()) ? Number(yearStr) : NaN
  const yearValid = Number.isInteger(yearNum) && (cal.usesEra ? yearNum >= 1 : true) && Math.abs(yearNum) < 1_000_000
  const astroYear = yearValid ? (cal.usesEra ? toAstronomical(yearNum, inputEra) : yearNum) : NaN
  const ymd = yearValid ? normalize(cal, { year: astroYear, month: monthNum, day: dayNum }) : null
  const fixed = ymd ? cal.toFixed!(ymd) : null
  const shownEra: Era = ymd && cal.usesEra ? fromAstronomical(ymd.year).era : era

  const setFromFixed = (calId: string, date: number) => {
    const c = getInputCalendar(calId)
    const v = c.fromFixed!(date)
    if (c.usesEra) {
      const { year, era } = fromAstronomical(v.year)
      set({ cal: calId, era, y: String(year), m: String(v.month), d: String(v.day) })
    } else set({ cal: calId, y: String(v.year), m: String(v.month), d: String(v.day) })
  }
  /** Changing one field turns an implicit "today" into explicit values. */
  const setField = (patch: { era?: string; y?: string; m?: string; d?: string }) => {
    if (usingToday && ymd) {
      const base = cal.usesEra ? fromAstronomical(ymd.year) : { year: ymd.year, era: 'AD' as Era }
      set({ era: base.era, y: String(base.year), m: String(ymd.month), d: String(ymd.day), ...patch })
    } else set(patch)
  }

  const months = ymd ? cal.months!(ymd.year) : []
  const dayCount = ymd ? cal.daysInMonth!(ymd.year, ymd.month) : 31

  return (
    <div>
      <PageHeader toolId="calendar" title="Calendar & era converter" description="Convert dates between AD/BC and CE/BCE, and across Gregorian, Julian, Islamic, Hebrew and other calendars." />
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
                onChange={(e) => (fixed != null ? setFromFixed(e.target.value, fixed) : set({ cal: e.target.value, era: 'AD', y: '', m: '', d: '' }))}
                options={inputCalendars.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Field>
            <div className={'grid gap-3 ' + (cal.usesEra ? 'grid-cols-2 sm:grid-cols-[1fr_1fr_1.4fr_0.8fr]' : 'grid-cols-[1fr_1.4fr_0.8fr]')}>
              {cal.usesEra && (
                <Field label="Era">
                  <Select
                    value={shownEra}
                    onChange={(e) => setField({ era: e.target.value })}
                    options={[{ value: 'AD', label: notation === 'CEBCE' ? 'CE' : 'AD' }, { value: 'BC', label: notation === 'CEBCE' ? 'BCE' : 'BC' }]}
                  />
                </Field>
              )}
              <Field label="Year">
                <Input inputMode="numeric" value={yearStr} onChange={(e) => setField({ y: e.target.value.trim() })} aria-invalid={!yearValid} />
              </Field>
              <Field label="Month">
                <Select value={String(ymd?.month ?? monthNum)} onChange={(e) => setField({ m: e.target.value })} options={months.map((m) => ({ value: String(m.value), label: m.label }))} />
              </Field>
              <Field label="Day">
                <Select
                  value={String(ymd?.day ?? dayNum)}
                  onChange={(e) => setField({ d: e.target.value })}
                  options={Array.from({ length: dayCount }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                />
              </Field>
            </div>
            {!yearValid && <p className="text-sm text-red-500">{cal.usesEra ? 'Enter a whole year of 1 or more. There is no year 0 in AD/BC.' : 'Enter a whole year.'}</p>}
            {cal.note && <p className="text-xs text-[var(--muted)]">{cal.note}</p>}
            <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
              <span className="text-xs font-medium text-[var(--muted)]">Era notation</span>
              <Segmented value={notation} onChange={(n) => set({ n })} options={[{ value: 'ADBC', label: 'AD / BC' }, { value: 'CEBCE', label: 'CE / BCE' }]} />
            </div>
            <aside className="mt-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 text-sm leading-relaxed text-[var(--muted)]">
              <p className="mb-1 font-semibold text-[var(--text)]">Good to know</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>There is <b className="text-[var(--text)]">no year 0</b>: 1 BC is followed directly by AD 1.</li>
                <li><b className="text-[var(--text)]">CE/BCE</b> are the same years as AD/BC, just a neutral name.</li>
                <li>Astronomers count 1 BC as year 0 and 2 BC as −1, which makes date maths easier.</li>
              </ul>
            </aside>
          </div>
        </Card>

        {fixed != null ? <Summary fixed={fixed} notation={notation} currentYear={Number(t.y)} /> : <Card><p className="text-sm text-[var(--muted)]">Enter a valid date.</p></Card>}
      </div>

      {fixed != null && (
        <Card title="Same day in every calendar" className="mt-4">
          <ul className="flex flex-col gap-0.5">
            {calendars.map((c) => {
              const text = c.format(fixed, notation)
              return (
                <li key={c.id} className={'-mx-2 flex flex-col gap-0.5 rounded-xl px-2 py-2.5 transition hover:bg-[var(--surface-2)]/70 sm:flex-row sm:items-center sm:gap-4' + (c.id === cal.id ? ' bg-amber-500/[0.07]' : '')}>
                  <span className="w-56 shrink-0 text-sm text-[var(--muted)]">
                    {c.name}
                    {c.note && <span title={c.note} className="ml-1 inline-flex align-middle"><Info size={12} /></span>}
                  </span>
                  <span className={'flex-1 text-[15px] tabular' + (c.id === cal.id ? ' font-semibold' : '')}>{text}</span>
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
      <p className="mt-1 bg-gradient-to-br from-amber-600 to-orange-600 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl dark:from-amber-200 dark:to-orange-300">{calendars[0].format(fixed, notation)}</p>
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
        <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-[var(--text)]">
          Before 15 Oct 1582 historical sources usually give dates in the <b>Julian</b> calendar. The Gregorian date shown is projected backwards (proleptic).
        </p>
      )}
    </Card>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 px-3.5 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]" title={hint}>{label}</dt>
      <dd className="mt-1 font-semibold tabular">{value}</dd>
    </div>
  )
}
