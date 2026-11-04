import { useCallback, useMemo, useState } from 'react'
import { Clock, Home, MapPinned, X } from 'lucide-react'
import { Card, Combobox, Field, Input, PageHeader, Segmented } from '../../components/ui'
import { usePersistentState } from '../../lib/usePersistentState'
import { useUrlState } from '../../lib/useUrlState'
import { useNow } from '../../lib/useNow'
import { WorldMap } from './map/WorldMap'
import { ZoneStrip } from './components/ZoneStrip'
import { canonicalZone, cleanZones, zoneLabel, zoneOptions } from './data/catalog'
import { isBoolean, isStringArray } from '../../services/storage'
import { utcMs } from '../../lib/dates'
import { MAX_YEAR, parseDateTime } from './logic/parse'
import { colorFor } from './logic/colors'
import { abbreviation, dayShift, formatDate, formatDiff, formatOffset, formatTime, isValidZone, localZone, offsetMinutes, wallTimeToEpoch, zonedParts } from './logic/tz'

const MAX_ZONES = 50
const DEFAULT_ZONES = cleanZones([localZone(), 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo']).slice(0, 4)

export default function TimezonesPage() {
  const now = useNow(1000)
  const [s, set] = useUrlState({ view: 'compare' })
  const [stored, setZones] = usePersistentState('tz:zones', DEFAULT_ZONES, isStringArray(MAX_ZONES))
  const zones = useMemo(() => cleanZones(stored, MAX_ZONES), [stored])
  const [hour12, setHour12] = usePersistentState('tz:hour12', false, isBoolean)
  /** null = live "now"; otherwise a pinned instant. */
  const [pinned, setPinned] = useState<number | null>(null)
  const ref = pinned ?? now
  // Offsets in the search list are refreshed hourly (DST can change while the page is open).
  const hour = Math.floor(now / 3_600_000)
  const options = useMemo(() => zoneOptions(hour * 3_600_000), [hour])

  const addZone = useCallback((z: string) => setZones((zs) => cleanZones([...zs, canonicalZone(z)], MAX_ZONES)), [setZones])
  const removeZone = (z: string) => setZones((zs) => cleanZones(zs, MAX_ZONES).filter((x) => x !== z))
  const makeHome = (z: string) => setZones((zs) => [z, ...cleanZones(zs, MAX_ZONES).filter((x) => x !== z)])
  const mapZones = useMemo(() => zones.map((zone, i) => ({ zone, color: colorFor(i) })), [zones])

  return (
    <div>
      <PageHeader toolId="timezones" title="Time zones" description="Compare time zones on a live world map, or convert a time from one zone to others." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={s.view as 'compare' | 'convert'}
          onChange={(view) => set({ view })}
          options={[
            { value: 'compare', label: <span className="inline-flex items-center gap-1.5"><MapPinned size={14} /> Compare & map</span> },
            { value: 'convert', label: <span className="inline-flex items-center gap-1.5"><Clock size={14} /> Convert</span> },
          ]}
        />
        <Segmented value={hour12 ? '12' : '24'} onChange={(v) => setHour12(v === '12')} options={[{ value: '24', label: '24h' }, { value: '12', label: '12h' }]} />
      </div>

      {s.view === 'convert' ? (
        <ConvertView zones={zones} options={options} hour12={hour12} onAdd={addZone} onShowCompare={(t) => { setPinned(t); set({ view: 'compare' }) }} />
      ) : (
        <div className="flex flex-col gap-4">
          <WorldMap selected={mapZones} epochMs={ref} onAdd={addZone} />
          <Card>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <Field label="Add a time zone">
                  <Combobox label="Add a time zone" value="" onChange={addZone} options={options} placeholder="City, country, or abbreviation (e.g. PST)" />
                </Field>
              </div>
              <TimeCursor now={now} pinned={pinned} setPinned={setPinned} />
            </div>
            {zones.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--muted)]">Click a country on the map or search above to add a time zone.</p>
            ) : (
              <ZoneList zones={zones} refTime={ref} hour12={hour12} onRemove={removeZone} onHome={makeHome} onPick={setPinned} />
            )}
            <Legend />
          </Card>
        </div>
      )}
    </div>
  )
}

function TimeCursor({ now, pinned, setPinned }: { now: number; pinned: number | null; setPinned: (t: number | null) => void }) {
  const base = Math.round(now / 900_000) * 900_000
  const offsetMin = pinned == null ? 0 : Math.round((pinned - base) / 60000)
  return (
    <div className="flex items-end gap-3 sm:w-80">
      <Field label={pinned == null ? 'Time: now (live)' : `Time: pinned, ${relativeLabel(pinned - now)}`} className="flex-1">
        <input
          type="range"
          min={-24 * 60}
          max={24 * 60}
          step={15}
          value={Math.max(-1440, Math.min(1440, offsetMin))}
          onChange={(e) => {
            const v = Number(e.target.value)
            setPinned(v === 0 ? null : base + v * 60000)
          }}
          className="h-10 w-full accent-[var(--accent)]"
          aria-label="Shift time"
          aria-valuetext={pinned == null ? 'now' : relativeLabel(pinned - now)}
        />
      </Field>
      <button
        onClick={() => setPinned(null)}
        disabled={pinned == null}
        className="h-10 shrink-0 rounded-lg border border-[var(--border)] px-3 text-sm disabled:opacity-40 enabled:hover:bg-[var(--surface-2)]"
      >
        Now
      </button>
    </div>
  )
}

function ZoneList({ zones, refTime, hour12, onRemove, onHome, onPick }: {
  zones: string[]; refTime: number; hour12: boolean
  onRemove: (z: string) => void; onHome: (z: string) => void; onPick: (t: number) => void
}) {
  const home = zones[0]
  const hp = zonedParts(home, refTime)
  const dayStart = wallTimeToEpoch(home, hp.year, hp.month, hp.day, 0, 0)
  // Next local midnight: days with a clock change have 23 or 25 hours.
  const next = new Date(utcMs(hp.year, hp.month, hp.day) + 86_400_000)
  const dayEnd = wallTimeToEpoch(home, next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0)
  const hours = Math.max(1, Math.ceil((dayEnd - dayStart) / 3_600_000))
  const cursorIndex = Math.min(hours - 1, Math.floor((refTime - dayStart) / 3_600_000))
  const homeOffset = offsetMinutes(home, refTime)

  return (
    <ul className="flex flex-col gap-1" data-testid="zone-list">
      {zones.map((z, i) => {
        const shift = dayShift(z, home, refTime)
        return (
          <li key={z} className="-mx-2 flex flex-col gap-2.5 rounded-xl px-2 py-2.5 transition hover:bg-[var(--surface-2)]/60 lg:flex-row lg:items-center lg:gap-4">
            <div className="flex min-w-0 items-center gap-3 lg:w-80 lg:shrink-0">
              <span className="h-9 w-1.5 shrink-0 rounded-full shadow-[var(--shadow-sm)]" style={{ background: colorFor(i) }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {i === 0 && <Home size={12} className="shrink-0 text-[var(--accent)]" aria-label="Home zone" />}
                  <span className="truncate">{zoneLabel(z)}</span>
                </div>
                <div className="truncate text-xs text-[var(--muted)]">
                  {zoneMeta(z, refTime)}
                  {i > 0 && <> · {formatDiff(offsetMinutes(z, refTime) - homeOffset)}</>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold tracking-tight tabular leading-tight">{formatTime(z, refTime, hour12)}</div>
                <div className="text-xs text-[var(--muted)]">
                  {formatDate(z, refTime)}
                  {shift !== 0 && <span className="ml-1 font-medium text-[var(--accent)]">{formatDayShift(shift)}</span>}
                </div>
              </div>
              <div className="flex shrink-0 flex-col">
                {i > 0 && (
                  <button aria-label={`Make ${z} the home zone`} title="Make home" onClick={() => onHome(z)} className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"><Home size={13} /></button>
                )}
                <button aria-label={`Remove ${z}`} title="Remove" onClick={() => onRemove(z)} className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"><X size={13} /></button>
              </div>
            </div>
            <ZoneStrip zone={z} dayStart={dayStart} hours={hours} cursorIndex={cursorIndex} onPick={(h) => onPick(dayStart + h * 3_600_000 + (refTime - dayStart) % 3_600_000)} />
          </li>
        )
      })}
    </ul>
  )
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/30" /> Working hours (9–17)</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400/30" /> Early / evening</span>
      <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-500/20" /> Night</span>
      <span>Click any hour to move the time. The first zone is “home”.</span>
    </div>
  )
}

function ConvertView({ zones, options, hour12, onAdd, onShowCompare }: {
  zones: string[]
  options: ReturnType<typeof zoneOptions>
  hour12: boolean
  onAdd: (z: string) => void
  onShowCompare: (t: number) => void
}) {
  const [u, set] = useUrlState({ from: '', date: '', time: '' })
  const from = u.from && isValidZone(u.from) ? canonicalZone(u.from) : zones[0] ?? canonicalZone(localZone())
  const nowParts = zonedParts(from, Date.now())
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = u.date || `${String(nowParts.year).padStart(4, '0')}-${pad(nowParts.month)}-${pad(nowParts.day)}`
  const time = u.time || `${pad(nowParts.hour)}:${pad(nowParts.minute)}`
  const parsed = parseDateTime(date, time)
  const t = parsed ? wallTimeToEpoch(from, parsed.y, parsed.mo, parsed.d, parsed.h, parsed.mi) : NaN
  const valid = parsed != null && Number.isFinite(t)
  const back = valid ? zonedParts(from, t) : null
  const shifted = valid && back && (back.hour !== parsed.h || back.minute !== parsed.mi)
  const targets = zones.filter((z) => z !== from)

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <Card title="From">
        <div className="flex flex-col gap-3">
          <Field label="Time zone">
            <Combobox label="Source time zone" value={from} onChange={(v) => set({ from: v })} options={options} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><Input type="date" value={date} onChange={(e) => set({ date: e.target.value })} /></Field>
            <Field label="Time"><Input type="time" value={time} onChange={(e) => set({ time: e.target.value })} /></Field>
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className={valid ? '' : 'text-red-500'}>{valid ? zoneMeta(from, t) : `Enter a valid date (years 1–${MAX_YEAR.toLocaleString()}) and time`}</span>
            <button onClick={() => set({ date: '', time: '' })} className="text-[var(--accent)] hover:underline">Use current time</button>
          </div>
          {shifted && (
            <p className="rounded-lg bg-amber-400/15 px-3 py-2 text-xs">
              {time} doesn’t exist in this zone on that day (clocks go forward). Shown as {pad(back!.hour)}:{pad(back!.minute)}.
            </p>
          )}
        </div>
      </Card>
      <Card
        title="Converted"
        actions={valid && <button onClick={() => onShowCompare(t)} className="text-sm text-[var(--accent)] hover:underline">Show on map</button>}
      >
        <div className="mb-4">
          <Field label="Add a target zone">
            <Combobox label="Add a target time zone" value="" onChange={onAdd} options={options} placeholder="City, country, or abbreviation" />
          </Field>
        </div>
        {!valid ? null : targets.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Add a zone to convert to.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]" data-testid="convert-results">
            {targets.map((z) => {
              const shift = dayShift(z, from, t)
              return (
                <li key={z} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-[var(--surface-2)]/60">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{zoneLabel(z)}</div>
                    <div className="text-xs text-[var(--muted)]">{shortAbbr(z, t) && `${shortAbbr(z, t)} · `}{formatDiff(offsetMinutes(z, t) - offsetMinutes(from, t))}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold tabular">{formatTime(z, t, hour12)}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {formatDate(z, t)}
                      {shift !== 0 && <span className="ml-1 font-medium text-[var(--accent)]">{formatDayShift(shift)}</span>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

function formatDayShift(shift: number) {
  const n = Math.abs(shift)
  return `${shift > 0 ? '+' : '−'}${n} day${n === 1 ? '' : 's'}`
}


/** "3h 15m ahead", "45m behind", "now"; days beyond 48 hours. */
function relativeLabel(ms: number) {
  const min = Math.round(ms / 60000)
  if (min === 0) return 'now'
  const dir = min > 0 ? 'ahead' : 'behind'
  const a = Math.abs(min)
  if (a >= 48 * 60) return `${Math.round(a / 1440).toLocaleString()} days ${dir}`
  return `${formatDiff(a).slice(1)} ${dir}`
}

/** Abbreviation only when it adds information ("EST", "CET"), not "GMT+5:30" next to "UTC+5:30". */
function shortAbbr(zone: string, t: number) {
  const a = abbreviation(zone, t)
  return /^(GMT|UTC)([+−-]|$)/.test(a) ? '' : a
}

function zoneMeta(zone: string, t: number) {
  const a = shortAbbr(zone, t)
  return (a ? a + ' · ' : '') + formatOffset(offsetMinutes(zone, t))
}
