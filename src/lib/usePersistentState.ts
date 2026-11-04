import { useEffect, useState } from 'react'
import { storage, type Validator } from '../services/storage'

export function usePersistentState<T>(key: string, initial: T, isValid: Validator<T>) {
  const [value, setValue] = useState<T>(() => storage.get(key, initial, isValid))
  useEffect(() => storage.set(key, value), [key, value])
  return [value, setValue] as const
}
