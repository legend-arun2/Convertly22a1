import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { geoCircle, geoEqualEarth, geoGraticule10, geoPath } from 'd3-geo'
import { select } from 'd3-selection'
import 'd3-transition'
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import world from 'world-atlas/countries-110m.json'
import { antisolarPoint } from '../logic/solar'
import { formatOffset, formatTime, formatDate, cityName, offsetMinutes as offsetOf } from '../logic/tz'
import { countryForFeature, countryName, groupByOffset, zoneGeo, zoneGeoById, type CountryInfo } from '../data/catalog'

const W = 960, H = 500
type CountryFeature = Feature<Geometry, { name: string }>

const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>
const countries = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>).features as CountryFeature[]
const projection = geoEqualEarth().fitExtent([[4, 4], [W - 4, H - 4]], { type: 'Sphere' })
const path = geoPath(projection)
const spherePath = path({ type: 'Sphere' })!
const graticulePath = path(geoGraticule10())!
const countryPaths = countries.map((f) => ({ f, d: path(f) ?? '', info: countryForFeature(f.id, f.properties.name) }))

export interface MapZone { zone: string; color: string }

type Hover =
  | { kind: 'country'; name: string; info?: CountryInfo; x: number; y: number }
  | { kind: 'zone'; zone: string; x: number; y: number }
  | null

interface Props {
  selected: MapZone[]
  epochMs: number
  onAdd: (zone: string) => void
}

export function WorldMap({ selected, epochMs, onAdd }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [t, setT] = useState({ k: 1, x: 0, y: 0 })
  const [hover, setHover] = useState<Hover>(null)
  const [picker, setPicker] = useState<{ info: CountryInfo; x: number; y: number } | null>(null)

  useEffect(() => {
    const svg = select(svgRef.current!)
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [W, H]])
      .clickDistance(5)
      .on('zoom', (e) => { setT({ k: e.transform.k, x: e.transform.x, y: e.transform.y }); setPicker(null) })
    zoomRef.current = z
    svg.call(z)
    return () => { svg.on('.zoom', null) }
  }, [])

  const zoomBy = (factor: number) => select(svgRef.current!).transition().duration(250).call(zoomRef.current!.scaleBy, factor)
  const reset = () => select(svgRef.current!).transition().duration(300).call(zoomRef.current!.transform, zoomIdentity)

  // Night shading, recomputed when the reference minute changes.
  const minute = Math.floor(epochMs / 60000)
  const night = useMemo(() => {
    const center = antisolarPoint(minute * 60000)
    return {
      twilight: path(geoCircle().center(center).radius(90)()) ?? '',
      dark: path(geoCircle().center(center).radius(82)()) ?? '',
    }
  }, [minute])

  const selectedSet = useMemo(() => new Set(selected.map((s) => s.zone)), [selected])
  const countryColor = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of selected) {
      const g = zoneGeoById.get(s.zone)
      g?.cc.forEach((cc) => { if (!m.has(cc)) m.set(cc, s.color) })
    }
    return m
  }, [selected])

  const relPos = (e: React.MouseEvent) => {
    const r = wrapRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onCountryClick = (info: CountryInfo | undefined, e: React.MouseEvent) => {
    if (!info || info.zones.length === 0) return
    const groups = groupByOffset(info.zones, epochMs)
    if (info.zones.length === 1 || groups.length === 1) onAdd(info.zones[0])
    else setPicker({ info, ...relPos(e) })
  }

  const showAllMarkers = t.k >= 2.5
  const markerR = (base: number) => base / Math.sqrt(t.k)

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--ocean)]" onMouseLeave={() => setHover(null)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="block h-[300px] w-full sm:h-auto cursor-grab touch-none select-none active:cursor-grabbing"
        role="img"
        aria-label="Interactive world map. Click a country to add its time zone."
      >
        <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
          <path d={spherePath} fill="var(--ocean)" stroke="var(--border)" vectorEffect="non-scaling-stroke" />
          <path d={graticulePath} fill="none" stroke="var(--border)" strokeOpacity={0.6} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
          <Countries
            hoverName={hover?.kind === 'country' ? hover.name : null}
            countryColor={countryColor}
            onHover={(name, info, e) => setHover({ kind: 'country', name, info, ...relPos(e) })}
            onClick={onCountryClick}
          />
          <g pointerEvents="none" data-testid="night-layer">
            <path d={night.twilight} fill="var(--night)" />
            <path d={night.dark} fill="var(--night)" />
          </g>
          {/* Zone markers: all zones when zoomed in; selected zones always. */}
          <g>
            {zoneGeo.map((z) => {
              const isSel = selectedSet.has(z.id)
              if (!isSel && !showAllMarkers) return null
              const p = projection([z.lon, z.lat])
              if (!p) return null
              const color = selected.find((s) => s.zone === z.id)?.color
              return (
                <circle
                  key={z.id}
                  cx={p[0]}
                  cy={p[1]}
                  r={markerR(isSel ? 5 : 3)}
                  fill={color ?? 'var(--surface)'}
                  stroke={color ? 'var(--surface)' : 'var(--accent)'}
                  strokeWidth={1.25}
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer"
                  onMouseMove={(e) => { e.stopPropagation(); setHover({ kind: 'zone', zone: z.id, ...relPos(e) }) }}
                  onClick={(e) => { e.stopPropagation(); onAdd(z.id) }}
                />
              )
            })}
          </g>
          {selected.map((s) => {
            const g = zoneGeoById.get(s.zone)
            const p = g && projection([g.lon, g.lat])
            if (!p) return null
            return (
              <text key={s.zone} x={p[0] + markerR(8)} y={p[1] + markerR(4)} fontSize={11 / t.k} fontWeight={600} fill="var(--text)" stroke="var(--surface)" strokeWidth={3 / t.k} paintOrder="stroke" pointerEvents="none">
                {cityName(s.zone)}
              </text>
            )
          })}
        </g>
      </svg>

      <div className="absolute right-2 top-2 flex flex-col gap-1">
        <MapBtn label="Zoom in" onClick={() => zoomBy(1.6)}><Plus size={14} /></MapBtn>
        <MapBtn label="Zoom out" onClick={() => zoomBy(1 / 1.6)}><Minus size={14} /></MapBtn>
        <MapBtn label="Reset view" onClick={reset}><RotateCcw size={13} /></MapBtn>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-[var(--surface)]/85 px-2 py-1 text-[11px] text-[var(--muted)] backdrop-blur">
        {showAllMarkers ? 'Click a dot to add that zone' : 'Click a country · scroll or pinch to zoom for cities'}
      </div>

      {hover && !picker && <Tooltip hover={hover} epochMs={epochMs} />}
      {picker && <ZonePicker {...picker} epochMs={epochMs} onPick={(z) => { onAdd(z); setPicker(null) }} onClose={() => setPicker(null)} />}
    </div>
  )
}

const Countries = memo(function Countries({ hoverName, countryColor, onHover, onClick }: {
  hoverName: string | null
  countryColor: Map<string, string>
  onHover: (name: string, info: CountryInfo | undefined, e: React.MouseEvent) => void
  onClick: (info: CountryInfo | undefined, e: React.MouseEvent) => void
}) {
  return (
    <g>
      {countryPaths.map(({ f, d, info }, i) => {
        const name = info?.name ?? f.properties.name
        const color = info ? countryColor.get(info.cc) : undefined
        const hovered = hoverName === name
        return (
          <path
            key={String(f.id ?? i)}
            d={d}
            data-country={name}
            fill={color ?? (hovered ? 'var(--land-hover)' : 'var(--land)')}
            fillOpacity={color ? (hovered ? 0.75 : 0.55) : 1}
            stroke="var(--surface)"
            strokeWidth={0.6}
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer transition-[fill] duration-100"
            onMouseMove={(e) => onHover(name, info, e)}
            onClick={(e) => onClick(info, e)}
          />
        )
      })}
    </g>
  )
})

function MapBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] shadow-sm hover:text-[var(--text)]">
      {children}
    </button>
  )
}

function place(x: number, y: number) {
  // Keep the floating box inside the map.
  return { left: Math.max(8, x + 14), top: Math.max(8, y + 14), transform: x > 520 ? 'translateX(calc(-100% - 28px))' : undefined }
}

function Tooltip({ hover, epochMs }: { hover: NonNullable<Hover>; epochMs: number }) {
  let body: React.ReactNode
  if (hover.kind === 'zone') {
    const g = zoneGeoById.get(hover.zone)
    body = (
      <>
        <div className="font-semibold">{cityName(hover.zone)}{g?.cc[0] ? `, ${countryName(g.cc[0])}` : ''}</div>
        <div className="text-[var(--muted)]">{hover.zone}{g?.note ? ` · ${g.note}` : ''}</div>
        <ZoneLine zone={hover.zone} epochMs={epochMs} />
      </>
    )
  } else {
    const groups = hover.info ? groupByOffset(hover.info.zones, epochMs) : []
    body = (
      <>
        <div className="font-semibold">{hover.name}</div>
        {groups.length === 0 && <div className="text-[var(--muted)]">No time zone data</div>}
        {groups.slice(0, 5).map((g) => <ZoneLine key={g.offset} zone={g.zones[0]} epochMs={epochMs} />)}
        {groups.length > 5 && <div className="text-[var(--muted)]">+{groups.length - 5} more offsets</div>}
        {groups.length > 1 && <div className="mt-1 text-[var(--muted)]">Click to choose a zone</div>}
      </>
    )
  }
  return (
    <div role="tooltip" className="pointer-events-none absolute z-10 min-w-44 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg" style={place(hover.x, hover.y)}>
      {body}
    </div>
  )
}

function ZoneLine({ zone, epochMs }: { zone: string; epochMs: number }) {
  return (
    <div className="mt-1 flex items-baseline justify-between gap-4 tabular">
      <span className="text-sm font-medium">{formatTime(zone, epochMs)}</span>
      <span className="text-[var(--muted)]">{formatDate(zone, epochMs)} · {formatOffset(offsetOf(zone, epochMs))}</span>
    </div>
  )
}


function ZonePicker({ info, x, y, epochMs, onPick, onClose }: { info: CountryInfo; x: number; y: number; epochMs: number; onPick: (z: string) => void; onClose: () => void }) {
  const groups = groupByOffset(info.zones, epochMs)
  return (
    <div className="absolute z-20 max-h-72 w-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-sm shadow-xl" style={place(x, y)}>
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="font-semibold">{info.name}</span>
        <button aria-label="Close" onClick={onClose} className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-2)]"><X size={14} /></button>
      </div>
      {groups.map((g) => (
        <div key={g.offset} className="py-1">
          <div className="px-1 text-[11px] font-medium text-[var(--muted)]">{formatOffset(g.offset)} · {formatTime(g.zones[0], epochMs)}</div>
          {g.zones.map((z) => (
            <button key={z} onClick={() => onPick(z)} className="block w-full truncate rounded px-2 py-1 text-left hover:bg-[var(--surface-2)]">
              {cityName(z)}
              {zoneGeoById.get(z)?.note && <span className="ml-1 text-xs text-[var(--muted)]">· {zoneGeoById.get(z)!.note}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
