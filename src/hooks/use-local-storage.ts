'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getStorageItem, setStorageItem } from '@/lib/storage'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const initialValueRef = useRef(initialValue)
  const [storedValue, setStoredValue] = useState<T>(initialValue)

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
