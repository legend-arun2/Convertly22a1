import { useEffect, useState } from 'react'
import { storage } from '../services/storage'

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => storage.get(key, initial))
  useEffect(() => storage.set(key, value), [key, value])
  return [value, setValue] as const
}
