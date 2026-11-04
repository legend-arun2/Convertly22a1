# Convertly

A clean, fast web app for everyday conversions:

- **Time zones**: compare zones on an interactive world map (hover for local time, click to add a zone, live day/night shading), with 24-hour strips and a time slider, or convert a specific date and time between zones.
- **Calendars & eras**: AD ↔ BC, CE ↔ BCE and astronomical years (there is no year 0), plus full dates across the Gregorian, Julian, Islamic, Hebrew, Buddhist, Indian national, Coptic and Ethiopian calendars. Persian, Chinese, Umm al-Qura and Japanese dates are shown using the browser's data.
- **Units**: length, area, mass, volume (US vs UK), temperature, speed, data size, pressure, energy and time, plus a metric vs imperial/US comparison.

Every conversion is stored in the URL, so you can share a link to it.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # type-check + production build into dist/
```

## Project structure

```
src/
  app/              shell: layout, navigation, home page, router
  components/ui/    shared UI primitives (Card, Field, Select, Combobox, …)
  lib/              hooks and helpers (URL state, persistent state, formatting)
  services/         storage (localStorage today, swappable for a backend) and cached HTTP
  tools/
    registry.ts     the list of tools: drives nav, routes, home grid and search
    calendar/       logic/ (pure, tested) + CalendarPage.tsx
    timezones/      logic/ + map/WorldMap.tsx + data/geo.json + TimezonesPage.tsx
    units/          logic/ + data/units.ts + UnitsPage.tsx
```

### Adding a new tool

1. Create `src/tools/<id>/` with a page component (default export) and pure logic in `logic/` with tests.
2. Export a `ToolDefinition` from `src/tools/<id>/index.ts` (name, path, icon, keywords, `lazy(() => import('./MyPage'))`).
3. Add it to the array in `src/tools/registry.ts`.

Navigation, routing, the home page and search pick it up automatically. Each tool is code-split.

- **Saved data** (favourites, history): use `usePersistentState(key, initial, validator)` or `storage` from `src/services/storage.ts`. Stored data is untrusted, so every read needs a validator. To add accounts later, implement `StorageService` against a backend; no tool code changes.
- **Live data** (e.g. currency rates): use `getJson(url, validate)` from `src/services/http.ts`. Add the API host to `ALLOWED_HOSTS` and to the CSP `connect-src` (in `vite.config.ts` and `vercel.json`). Never put API secrets in `VITE_*` variables: they are public. Use a server-side proxy.

### Time zone data

`src/tools/timezones/data/geo.json` is generated from tz database metadata and ISO country codes:

```bash
npm run gen:tz
```

The conversions themselves use the browser's built-in `Intl` API, which ships an up-to-date tz database.

## Security

- Production builds include a strict Content-Security-Policy (`vite.config.ts`). The Vercel config also sends it as an HTTP header, with `frame-ancestors 'none'`.
- No source maps are shipped. URL parameters and stored data are validated, and crashes are contained by an error boundary.
- CI uses least-privilege permissions, SHA-pinned actions and `npm ci --ignore-scripts`. Dependabot keeps actions and npm packages up to date.
- Before adding accounts, move to a dedicated domain (e.g. Vercel). On `*.github.io`, browser storage is shared with the owner's other Pages sites.

## Deployment

### GitHub Pages (current)

`.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site is served at `https://<owner>.github.io/<repo>/`. The build sets `VITE_BASE=/<repo>/`, and
`404.html` (a copy of `index.html`) makes deep links such as `/<repo>/timezones` work.

### Vercel (later)

Import the repository in Vercel. It detects Vite, builds with `npm run build` and serves `dist/`.
Leave `VITE_BASE` unset (base `/`). `vercel.json` already contains the SPA rewrite. No code changes are needed.
You can then disable the GitHub Pages workflow.
