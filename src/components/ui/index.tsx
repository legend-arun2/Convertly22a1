import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes } from 'react'
import { ArrowLeftRight, Check, Copy, Search } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Card({ children, className, title, actions }: { children: ReactNode; className?: string; title?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={cn('rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5', className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Field({ label, children, className, hint }: { label: string; children: ReactNode; className?: string; hint?: ReactNode }) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      {children}
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
    </label>
  )
}

const control =
  'h-10 w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, 'tabular', props.className)} />
}

export function Select({ options, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string; group?: string }[] }) {
  const groups = useMemo(() => {
    const m = new Map<string, typeof options>()
    for (const o of options) {
      const g = o.group ?? ''
      if (!m.has(g)) m.set(g, [])
      m.get(g)!.push(o)
    }
    return [...m.entries()]
  }, [options])
  return (
    <select {...props} className={cn(control, 'pr-8', props.className)}>
      {groups.map(([g, opts]) =>
        g ? (
          <optgroup key={g} label={g}>
            {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </optgroup>
        ) : (
          opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
        ),
      )}
    </select>
  )
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto rounded-xl bg-[var(--surface-2)] p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition',
            o.value === value ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function IconButton({ label, onClick, children, className }: { label: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]', className)}
    >
      {children}
    </button>
  )
}

export function SwapButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton label="Swap" onClick={onClick}>
      <ArrowLeftRight size={16} />
    </IconButton>
  )
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      aria-label="Copy"
      title="Copy"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1200)
        })
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

/** Searchable dropdown for long lists (e.g. ~400 time zones). */
export function Combobox({ value, onChange, options, placeholder, label }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; detail?: string; search?: string }[]
  placeholder?: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? options.filter((o) => (o.label + ' ' + (o.search ?? '') + ' ' + o.value).toLowerCase().includes(q)) : options
    return list.slice(0, 80)
  }, [options, query])

  // Keep the highlighted option visible while navigating with the keyboard.
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, listId])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = (v: string) => { onChange(v); setOpen(false); setQuery('') }

  return (
    <div ref={ref} className="relative min-w-0">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          aria-label={label}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
          className={cn(control, 'pl-8')}
          placeholder={current ? current.label : placeholder}
          value={open ? query : current?.label ?? ''}
          onFocus={() => { setOpen(true); setActive(0) }}
          onClick={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0) }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, filtered.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
            else if (e.key === 'Enter' && filtered[active]) { e.preventDefault(); pick(filtered[active].value) }
            else if (e.key === 'Escape') setOpen(false)
          }}
        />
      </div>
      {open && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-72 w-full min-w-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg">
          {filtered.length === 0 && <li className="px-3 py-2 text-sm text-[var(--muted)]">No matches</li>}
          {filtered.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseDown={(e) => { e.preventDefault(); pick(o.value) }}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-1.5 text-sm', i === active && 'bg-[var(--surface-2)]')}
            >
              <span className="truncate">{o.label}</span>
              {o.detail && <span className="shrink-0 text-xs text-[var(--muted)] tabular">{o.detail}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
    </div>
  )
}
