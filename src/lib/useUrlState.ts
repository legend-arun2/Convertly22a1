import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

const MAX_PARAM_LENGTH = 256

/** State stored in the URL query string, so any conversion can be shared as a link. */
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const [params, setParams] = useSearchParams()
  const state = Object.fromEntries(
    Object.entries(defaults).map(([k, d]) => {
      const raw = params.get(k)
      // Over-long values are ignored: every value here is short (numbers, dates, ids).
      return [k, raw != null && raw.length <= MAX_PARAM_LENGTH ? raw : d]
    }),
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
    [setParams],
  )
  return [state, update] as const
}
