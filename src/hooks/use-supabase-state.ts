'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook that mirrors useLocalStorage but persists to Supabase via API routes.
 * Falls back to localStorage if API is unavailable.
 */
export function useSupabaseState<T>(
  endpoint: string,
  fallbackKey: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, { loaded: boolean; saving: boolean }] {
  const [data, setData] = useState<T>(initialValue)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const skipNextSync = useRef(false)

  // Load from API on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(endpoint)
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        const items = Array.isArray(json) && json.length > 0 ? json : null
        if (items !== null) {
          setData(json as T)
          skipNextSync.current = true
        } else {
          // Fallback to localStorage
          const raw = localStorage.getItem(fallbackKey)
          if (raw) {
            const parsed = JSON.parse(raw) as T
            setData(parsed)
          }
        }
      } catch {
        // Fallback to localStorage
        try {
          const raw = localStorage.getItem(fallbackKey)
          if (raw) setData(JSON.parse(raw) as T)
        } catch { /* ignore */ }
      } finally {
        setLoaded(true)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync to API on data change
  useEffect(() => {
    if (!loaded) return
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }

    // Also save to localStorage as cache
    try {
      localStorage.setItem(fallbackKey, JSON.stringify(data))
    } catch { /* ignore */ }

    const controller = new AbortController()
    setSaving(true)

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    })
      .catch(() => { /* silent — localStorage is the fallback */ })
      .finally(() => setSaving(false))

    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loaded])

  return [data, setData, { loaded, saving }]
}
