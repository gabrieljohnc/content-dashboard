'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getStorageItem, setStorageItem } from '@/lib/storage'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const initialValueRef = useRef(initialValue)

  // Initialize from localStorage synchronously when possible
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    return getStorageItem(key, initialValue)
  })

  // Re-sync if key changes
  useEffect(() => {
    const item = getStorageItem(key, initialValueRef.current)
    setStoredValue(item)
  }, [key])

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value
      setStorageItem(key, newValue)
      return newValue
    })
  }, [key])

  return [storedValue, setValue]
}
