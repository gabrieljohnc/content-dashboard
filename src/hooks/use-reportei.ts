'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './use-local-storage'
import type { PlatformData, ReporteiProject, ReporteiIntegration } from '@/lib/reportei-types'

// ---------------------------------------------------------------------------
// Fetch helper (token is server-side, no need to send from client)
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.error || `Erro ${res.status}`)
  }

  return json
}

// ---------------------------------------------------------------------------
// Projects hook
// ---------------------------------------------------------------------------

export function useProjects() {
  const [projects, setProjects] = useState<ReporteiProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ data: ReporteiProject[] }>(
        '/api/reportei/projects'
      )
      setProjects(res.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  return { projects, loading, error, refetch: fetch_ }
}

// ---------------------------------------------------------------------------
// Integrations hook
// ---------------------------------------------------------------------------

export function useIntegrations(projectId: number | null) {
  const [integrations, setIntegrations] = useState<(ReporteiIntegration & { platform: string | null })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ data: (ReporteiIntegration & { platform: string | null })[] }>(
        `/api/reportei/integrations?project_id=${projectId}`
      )
      setIntegrations(res.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  return { integrations, loading, error, refetch: fetch_ }
}

// ---------------------------------------------------------------------------
// Platform data hook (main analytics data)
// ---------------------------------------------------------------------------

export interface PlatformDataResult {
  data: PlatformData[]
  insights: string[]
  period: { start: string; end: string }
}

export function usePlatformData(
  projectId: number | null,
  startDate: string,
  endDate: string,
  comparisonStart?: string,
  comparisonEnd?: string,
  enabled: boolean = true
) {
  const [result, setResult] = useState<PlatformDataResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    if (!projectId || !startDate || !endDate || !enabled) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<PlatformDataResult>(
        '/api/metrics/data',
        {
          method: 'POST',
          body: JSON.stringify({
            project_id: projectId,
            start: startDate,
            end: endDate,
            comparison_start: comparisonStart,
            comparison_end: comparisonEnd,
          }),
        }
      )
      setResult(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, startDate, endDate, comparisonStart, comparisonEnd, enabled])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  return { result, loading, error, refetch: fetch_ }
}

// ---------------------------------------------------------------------------
// Selected project persistence
// ---------------------------------------------------------------------------

export function useSelectedProject() {
  return useLocalStorage<number | null>('content-dashboard:reportei-project-id', null)
}

// ---------------------------------------------------------------------------
// Clear cache
// ---------------------------------------------------------------------------

export async function clearReporteiCache() {
  await fetch('/api/reportei/cache', { method: 'DELETE' })
}
