import { Suspense } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'
import { tools } from '../tools/registry'
import { cn } from '../lib/cn'
import { ThemeToggle } from './ThemeToggle'

export function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-7 w-7" />
            <span>Convertly</span>
          </Link>
          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {tools.map((t) => (
              <NavLink
                key={t.id}
                to={`/${t.path}`}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition',
                    isActive ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--text)]',
                  )
                }
              >
                <t.icon size={16} />
                <span className="hidden sm:inline">{t.name}</span>
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {/* Keyed by path: navigating to another tool clears an error. */}
        <ErrorBoundary key={pathname} resetPath={pathname}>
          <Suspense fallback={<div className="py-20 text-center text-sm text-[var(--muted)]">Loading…</div>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--muted)]">
        Convertly · Dates, time zones and units
      </footer>
    </div>
  )
}
