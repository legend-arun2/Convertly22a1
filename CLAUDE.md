# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm ci                                        # install (.npmrc disables install scripts; Node per .nvmrc)
npm run dev                                   # Vite dev server (http://localhost:5173)
npm test                                      # all unit tests (Vitest, node environment)
npx vitest run src/tools/calendar             # tests under one folder
npx vitest run -t "no year 0"                 # tests whose name matches
npm run lint                                  # type-check only (tsc -b --noEmit); there is no ESLint
npm run build                                 # tsc + vite build + scripts/postbuild.mjs (fails if the CSP meta is missing; writes dist/404.html)
VITE_BASE=/convertly/ npm run build           # build for a GitHub Pages sub-path
VITE_BASE=/convertly/ npx vite preview        # preview MUST get the same VITE_BASE, or assets 404
npm run gen:tz                                # regenerate src/tools/timezones/data/geo.json
```

Vitest only collects `src/**/*.test.ts` (see `vite.config.ts`). For UI checks, Playwright and Chromium are available in this environment via `require('playwright')`.

## Architecture

**Tool registry.** Every feature is a "tool": `src/tools/<id>/index.ts` exports a `ToolDefinition` (`src/tools/types.ts`) with a `lazy()` page component. `src/tools/registry.ts` is the single list. The nav (`app/Layout.tsx`), routes (`app/App.tsx`), home grid and search (`app/Home.tsx`) are all generated from it. To add a tool, create the folder and add one line to the registry. Each tool keeps pure, React-free logic in `logic/` with co-located tests, and data in `data/`.

**Design system.** Colour tokens (light and dark) live as CSS variables in `src/index.css`. Use `var(--surface)`, `var(--muted)`, `var(--shadow-md)` and so on, never raw colours, so both themes work. Each tool has an `accent` in its `ToolDefinition`. Classes come from `src/tools/accents.ts` as literal strings, because Tailwind cannot see dynamically built class names. The Inter font is self-hosted via `@fontsource-variable/inter` (the CSP allows `font-src 'self'` only). `PageHeader toolId="…"` renders the tool's icon badge.

**State.**
- **Shareable state** lives in the URL via `lib/useUrlState.ts`. `<BrowserRouter useTransitions={false}>` in `app/App.tsx` is required: with transitions on, URL-bound inputs drop keystrokes and lose the caret. Import routing from `react-router` (not `react-router-dom`). A value equal to its default is removed from the query string, so use empty-string defaults for anything that must survive sharing (the calendar date uses `''` to mean "today, resolved at render").
- **Persistent state** goes through `services/storage.ts` / `lib/usePersistentState.ts`. Every read requires a validator, because localStorage is untrusted (on `*.github.io` it is shared with other Pages sites). Swap in a backend by implementing `StorageService`.
- `services/http.ts` is the only sanctioned fetch path (host allow-list, timeout, response validator). It is not used yet.

**Calendars** (`tools/calendar/logic/`).
- All conversions pivot on a Rata Die fixed day number (R.D. 1 = 1 Jan AD 1 Gregorian), following Reingold & Dershowitz.
- Years are astronomical internally (1 BC = 0). `era.ts` converts to and from AD/BC and CE/BCE.
- `calendars.ts` holds the `CalendarSystem` registry:
  - `kind: 'exact'` calendars have two-way arithmetic and can be used for input (`getInputCalendar`).
  - `kind: 'display'` calendars (Persian, Chinese, Umm al-Qura, Japanese) only format via `Intl` and must never be used as input.
- Do not use `@js-temporal/polyfill` for calendars; it was removed for being buggy with non-ISO calendars.

**Time zones** (`tools/timezones/`).
- All maths uses `Intl` only (`logic/tz.ts`). `wallTimeToEpoch` resolves times skipped by DST forward, and repeated times to the earlier occurrence.
- Never use `Date.UTC` for arbitrary years, because it maps years 0–99 to the 1900s. Use `utcMs` from `lib/dates.ts`.
- `data/geo.json` is generated (tz metadata from `moment-timezone` plus ISO numeric codes from `world-countries`, both devDependencies, never bundled). It maps world-atlas feature ids to countries and zones, with each country's primary zone first.
- Browsers may report legacy names (`Asia/Calcutta`). Always pass zones through `canonicalZone` / `cleanZones` in `data/catalog.ts`.
- `map/WorldMap.tsx` draws an SVG with d3-geo (Equal Earth projection), d3-zoom and world-atlas 110m.
  - Night shading is a `geoCircle` around the antisolar point (`logic/solar.ts`).
  - The `Countries` layer is memoised and receives stable callbacks, because the page re-renders every second (`useNow`).
  - Popups use `Floating`, which clamps them inside the map. On narrow screens the country zone picker is docked below the map.

**Units** (`tools/units/data/units.ts`).
- Units are data-driven: each unit has `toBase`/`fromBase` functions relative to its category's base unit. Use `linear()` for factor units.
- `Category.minBase` sets a physical lower bound (0 K for temperature).
- `parseNumber` accepts decimal commas.

## Deployment and security constraints

- **Hosting:** GitHub Pages now (`.github/workflows/deploy.yml`, built with `VITE_BASE=/<repo>/`), Vercel later (`vercel.json` already has the SPA rewrite and security headers; leave `VITE_BASE` unset). App code must not hard-code `/` paths: use `import.meta.env.BASE_URL`, or reference `public/` files from `index.html` with an absolute `/…` path so Vite prefixes the base.
- **CSP:** `csp.config.ts` is the single source. `vite.config.ts` injects it as a meta tag in production, and `vercel.json` must carry the same value plus `frame-ancestors 'none'` (`src/security.test.ts` enforces this). The policy uses `default-src 'none'` and Trusted Types, so it forbids inline scripts, `innerHTML`/`dangerouslySetInnerHTML`, `data:` images and external hosts. That is why the theme bootstrap lives in `public/theme.js`. When adding an API host, update `connect-src` and `ALLOWED_HOSTS` in `services/http.ts`. Anything in `VITE_*` env vars ends up in the public bundle.
- **Untrusted input:** user-facing parsers must be linear-time (no nested quantifiers) and length-capped. `useUrlState` ignores values over 256 characters, and `parseNumber` rejects input over 100 characters.
- **CI:** `ci.yml` checks PRs and non-main branches; `deploy.yml` deploys `main`, getting the base path from `actions/configure-pages`. Actions are pinned to commit SHAs with exact version comments (Dependabot updates them, with a 7-day cooldown). Installs use `npm ci --ignore-scripts` followed by `npm audit signatures`, and there is no dependency cache. Keep `pages: write` / `id-token: write` on the deploy job only. In this sandbox, `npm audit signatures` fails with a 403 because the proxy blocks Sigstore; it works on GitHub runners.
