import { Suspense } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Lock, Share2, ShieldCheck } from 'lucide-react'
import { ErrorBoundary } from './ErrorBoundary'
import { tools } from '../tools/registry'
import { cn } from '../lib/cn'
import { ThemeToggle } from './ThemeToggle'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center justify-center rounded-[10px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shadow-[var(--shadow-sm)]', className)}>
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]" aria-hidden="true">
        <path d="M8 12h14l-4-4M24 20H10l4 4" stroke="currentColor" strokeWidth="2.75" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function Layout() {
  const { pathname, search } = useLocation()
  // Reset target comes from the registry, never from the raw URL (a path like "//evil.com"
  // would otherwise become an off-site link).
  const tool = tools.find((t) => pathname === `/${t.path}` || pathname.startsWith(`/${t.path}/`))
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[var(--surface)] focus:px-3 focus:py-2 focus:shadow-[var(--shadow-lg)]">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 text-[17px] font-semibold tracking-tight">
            <Logo className="h-8 w-8" />
            <span>Convertly</span>
          </Link>
          <nav aria-label="Tools" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {tools.map((t) => (
              <NavLink
                key={t.id}
                to={`/${t.path}`}
                aria-label={t.name}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--border)]'
                      : 'text-[var(--muted)] hover:bg-[var(--surface)]/70 hover:text-[var(--text)]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <t.icon size={16} strokeWidth={2} className={isActive ? 'text-[var(--accent)]' : ''} />
                    <span className="hidden sm:inline">{t.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        {/* Keyed by path: navigating to another tool clears an error. */}
        <ErrorBoundary key={pathname} resetPath={tool ? `/${tool.path}` : '/'} resetKey={search}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <div>
              <div className="text-sm font-semibold">Convertly</div>
              <div className="text-xs text-[var(--muted)]">Dates, time zones and units</div>
            </div>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
            <li className="inline-flex items-center gap-1.5"><Lock size={13} /> Runs entirely in your browser</li>
            <li className="inline-flex items-center gap-1.5"><Share2 size={13} /> Every result is a shareable link</li>
            <li className="inline-flex items-center gap-1.5"><ShieldCheck size={13} /> No tracking, no sign-up</li>
          </ul>
        </div>
      </footer>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-3 h-8 w-56 rounded-lg bg-[var(--surface-2)]" />
      <div className="mb-8 h-4 w-96 max-w-full rounded bg-[var(--surface-2)]" />
      <div className="h-72 rounded-2xl bg-[var(--surface-2)]" />
    </div>
  )
}
