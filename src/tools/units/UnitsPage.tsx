import { useMemo } from 'react'
import { Card, CopyButton, Field, Input, PageHeader, Segmented, Select, SwapButton } from '../../components/ui'
import { useUrlState } from '../../lib/useUrlState'
import { formatNumber } from '../../lib/format'
import { categories, comparisons, references } from './data/units'
import { belowMinimum, convert, findUnit, parseNumber } from './logic/convert'
import type { Category } from './logic/types'

export default function UnitsPage() {
  const [s, set] = useUrlState({ view: 'convert', cat: 'length', from: '', to: '', v: '1' })
  return (
    <div>
      <PageHeader title="Unit converter" description="Convert length, mass, volume, temperature and more. Compare metric with imperial and US units." />
      <Segmented
        className="mb-5 w-fit"
        value={s.view as 'convert' | 'compare'}
        onChange={(view) => set({ view })}
        options={[{ value: 'convert', label: 'Convert' }, { value: 'compare', label: 'Metric vs Imperial/US' }]}
      />
      {s.view === 'compare' ? <CompareView /> : <ConvertView s={s} set={set} />}
    </div>
  )
}

type S = { cat: string; from: string; to: string; v: string }

function ConvertView({ s, set }: { s: S; set: (p: Partial<S>) => void }) {
  const cat = categories.find((c) => c.id === s.cat) ?? categories[0]
  const from = findUnit(cat, s.from) ? s.from : cat.defaultFrom
  const to = findUnit(cat, s.to) ? s.to : cat.defaultTo
  const parsed = parseNumber(s.v)
  const tooLow = !Number.isNaN(parsed) && belowMinimum(parsed, cat, from)
  const value = tooLow ? NaN : parsed
  const result = Number.isNaN(value) ? NaN : convert(value, cat, from, to)
  const fromU = findUnit(cat, from)!
  const toU = findUnit(cat, to)!
  const options = useMemo(() => cat.units.map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})`, group: u.group })), [cat])

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Segmented
          value={cat.id}
          onChange={(id) => set({ cat: id, from: '', to: '' })}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Card>
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_1fr]">
            <Field label="Value">
              <Input inputMode="decimal" value={s.v} onChange={(e) => set({ v: e.target.value })} aria-invalid={Number.isNaN(value)} />
            </Field>
            <Field label="From">
              <Select value={from} onChange={(e) => set({ from: e.target.value })} options={options} />
            </Field>
            <div className="flex justify-center"><SwapButton onClick={() => set({ from: to, to: from })} /></div>
            <Field label="To">
              <Select value={to} onChange={(e) => set({ to: e.target.value })} options={options} />
            </Field>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-4 py-4">
            <p className="min-w-0 flex-1 break-words text-lg sm:text-2xl">
              {Number.isNaN(value) ? (
                <span className={'text-sm ' + (tooLow ? 'text-red-500' : 'text-[var(--muted)]')}>
                  {tooLow ? 'That is below absolute zero (0 K = −273.15 °C = −459.67 °F), which is physically impossible.' : 'Enter a number to convert.'}
                </span>
              ) : (
                <>
                  <span className="text-[var(--muted)] tabular">{formatNumber(value)} {fromU.symbol} =</span>{' '}
                  <span className="font-semibold tabular">{formatNumber(result)} {toU.symbol}</span>
                </>
              )}
            </p>
            {!Number.isNaN(result) && <CopyButton text={formatNumber(result)} />}
          </div>
        </Card>
      </div>
      <AllEquivalents cat={cat} value={value} fromId={from} />
    </div>
  )
}

function AllEquivalents({ cat, value, fromId }: { cat: Category; value: number; fromId: string }) {
  const groups = useMemo(() => {
    const m = new Map<string, Category['units']>()
    for (const u of cat.units) {
      if (!m.has(u.group)) m.set(u.group, [])
      m.get(u.group)!.push(u)
    }
    return [...m.entries()]
  }, [cat])
  return (
    <Card title="All equivalents">
      {Number.isNaN(value) ? (
        <p className="text-sm text-[var(--muted)]">—</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([g, units]) => (
            <div key={g}>
              <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{g}</h3>
              <ul className="divide-y divide-[var(--border)]">
                {units.map((u) => (
                  <li key={u.id} className={'flex justify-between gap-3 py-1.5 text-sm' + (u.id === fromId ? ' font-semibold' : '')}>
                    <span className="text-[var(--muted)]">{u.name}</span>
                    <span className="text-right tabular">{formatNumber(convert(value, cat, fromId, u.id))} {u.symbol}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function CompareView() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card title="Common equivalents">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--muted)]">
                <th className="pb-2 font-medium">Quantity</th>
                <th className="pb-2 font-medium">Metric</th>
                <th className="pb-2 font-medium" aria-hidden></th>
                <th className="pb-2 font-medium">Imperial / US</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {comparisons.map((c, i) => {
                const cat = categories.find((x) => x.id === c.category)!
                const m = findUnit(cat, c.metric)!
                const o = findUnit(cat, c.other)!
                const other = c.otherValue ?? convert(c.value, cat, c.metric, c.other)
                const metric = c.otherValue != null ? convert(c.otherValue, cat, c.other, c.metric) : c.value
                return (
                  <tr key={i}>
                    <td className="py-2 text-[var(--muted)]">{cat.name}</td>
                    <td className="py-2 tabular">{formatNumber(metric, 6)} {m.symbol}</td>
                    <td className="px-2 py-2 text-[var(--muted)]">=</td>
                    <td className="py-2 tabular">{formatNumber(other, 6)} {o.symbol} <span className="text-xs text-[var(--muted)]">({o.name})</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="flex flex-col gap-4">
        <Card title="How big is it?">
          <ul className="divide-y divide-[var(--border)] text-sm">
            {references.map((r) => (
              <li key={r.label} className="py-2">
                <div className="text-[var(--muted)]">{r.label}</div>
                <div className="flex justify-between tabular"><span>{r.metric}</span><span>{r.imperial}</span></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Good to know">
          <ul className="list-disc space-y-1.5 pl-4 text-sm text-[var(--muted)]">
            <li>Metric units scale by powers of 10: 100 cm = 1 m, 1000 m = 1 km.</li>
            <li>US and UK (imperial) gallons, pints and fluid ounces are different sizes.</li>
            <li>A US “ton” (2000 lb) is lighter than a metric tonne (1000 kg) and a UK long ton.</li>
            <li>Disk makers use GB (10⁹ bytes); many operating systems report GiB (2³⁰ bytes).</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
