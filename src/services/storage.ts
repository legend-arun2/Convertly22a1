/**
 * All persistence goes through this interface so a backend (accounts, sync)
 * can replace localStorage later without touching tool code.
 */
export interface StorageService {
  get<T>(key: string, fallback: T): T
  set<T>(key: string, value: T): void
}

class LocalStorageService implements StorageService {
  constructor(private prefix = 'convertly:') {}
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(this.prefix + key)
      return raw == null ? fallback : (JSON.parse(raw) as T)
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
