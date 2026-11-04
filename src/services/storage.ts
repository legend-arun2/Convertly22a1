/**
 * All persistence goes through this interface so a backend (accounts, sync)
 * can replace localStorage later without touching tool code.
 *
 * Stored data is untrusted (it can be edited by the user or, on a shared origin such as
 * *.github.io, by other sites), so every read is checked with a validator.
 */
export type Validator<T> = (v: unknown) => v is T

export interface StorageService {
  get<T>(key: string, fallback: T, isValid: Validator<T>): T
  set<T>(key: string, value: T): void
}

class LocalStorageService implements StorageService {
  constructor(private prefix = 'convertly:') {}
  get<T>(key: string, fallback: T, isValid: Validator<T>): T {
    try {
      const raw = localStorage.getItem(this.prefix + key)
      if (raw == null) return fallback
      const v: unknown = JSON.parse(raw)
      return isValid(v) ? v : fallback
    } catch {
      return fallback
    }
  }
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value))
    } catch {
      /* storage unavailable (private mode) — ignore */
    }
  }
}

export const storage: StorageService = new LocalStorageService()

export const isBoolean: Validator<boolean> = (v): v is boolean => typeof v === 'boolean'
export const isString: Validator<string> = (v): v is string => typeof v === 'string'
export const isStringArray = (maxLength: number): Validator<string[]> =>
  (v): v is string[] => Array.isArray(v) && v.length <= maxLength && v.every((x) => typeof x === 'string' && x.length < 100)
