import { Component, type ReactNode } from 'react'
import { Link } from 'react-router'

interface Props { children: ReactNode; resetPath: string; resetKey?: string }
interface State { error: Error | null }

/** Contains a crash to one tool instead of blanking the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidUpdate(prev: Props) {
    // Navigating to different query parameters (e.g. Back to a valid link) clears the error.
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    // After a redeploy, old lazy-loaded chunks no longer exist: a reload fetches the new ones.
    const chunkError = /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(error.message)
    // Backstop: always a same-origin, in-app path.
    const resetTo = '/' + this.props.resetPath.replace(/^[\\/]+/, '')
    return (
      <div role="alert" className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-lg font-semibold">{chunkError ? 'A new version is available' : 'Something went wrong'}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {chunkError ? 'Reload the page to get the latest version.' : 'This page hit an unexpected problem, possibly from an invalid link.'}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          {chunkError ? (
            <button onClick={() => location.reload()} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">Reload</button>
          ) : (
            <Link reloadDocument to={resetTo} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white">Start over</Link>
          )}
          <Link reloadDocument to="/" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">Home</Link>
        </div>
      </div>
    )
  }
}
