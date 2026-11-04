import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/** State stored in the URL query string, so any conversion can be shared as a link. */
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const [params, setParams] = useSearchParams()
  const state = Object.fromEntries(
    Object.entries(defaults).map(([k, d]) => [k, params.get(k) ?? d]),
  ) as T
  const update = useCallback(
    (patch: Partial<T>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (v == null || v === defaults[k]) next.delete(k)
            else next.set(k, v as string)
          }
          return next
        },
        { replace: true },
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams],
  )
  return [state, update] as const
}
