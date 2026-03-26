import type {
  ReporteiProject,
  ReporteiIntegration,
  ReporteiMetricDefinition,
  ReporteiMetricRequest,
  ReporteiMetricResponse,
  ReporteiPaginatedResponse,
} from './reportei-types'

const BASE_URL = 'https://app.reportei.com/api/v2'
export function getFixedToken(): string {
  const token = process.env.REPORTEI_TOKEN
  if (!token) throw new Error('REPORTEI_TOKEN não configurado nas variáveis de ambiente.')
  return token
}

// ---------------------------------------------------------------------------
// In-memory cache (server-side) with TTL
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

// ---------------------------------------------------------------------------
// Rate limiting tracker
// ---------------------------------------------------------------------------

const requestLog: { timestamp: number; type: 'GET' | 'POST' }[] = []

function canMakeRequest(type: 'GET' | 'POST'): boolean {
  const now = Date.now()
  const oneMinuteAgo = now - 60_000
  // Clean old entries
  while (requestLog.length > 0 && requestLog[0].timestamp < oneMinuteAgo) {
    requestLog.shift()
  }
  const count = requestLog.filter(r => r.type === type).length
  const limit = type === 'GET' ? 120 : 30
  return count < limit
}

function logRequest(type: 'GET' | 'POST'): void {
  requestLog.push({ timestamp: Date.now(), type })
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

async function reporteiFetch<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase() as 'GET' | 'POST'

  if (!canMakeRequest(method)) {
    throw new Error(`Rate limit exceeded for ${method} requests. Try again in a moment.`)
  }

  const url = `${BASE_URL}${endpoint}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  })

  logRequest(method)

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Reportei API error ${res.status}: ${errorBody}`)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

export async function getProjects(token: string): Promise<ReporteiProject[]> {
  const cacheKey = 'projects'
  const cached = getCached<ReporteiProject[]>(cacheKey)
  if (cached) return cached

  const response = await reporteiFetch<ReporteiPaginatedResponse<ReporteiProject>>(
    '/projects',
    token
  )
  const data = response.data || []
  setCache(cacheKey, data, 10 * 60 * 1000) // 10min cache
  return data
}

export async function getIntegrations(
  token: string,
  projectId: number
): Promise<ReporteiIntegration[]> {
  const cacheKey = `integrations_${projectId}`
  const cached = getCached<ReporteiIntegration[]>(cacheKey)
  if (cached) return cached

  const response = await reporteiFetch<ReporteiPaginatedResponse<ReporteiIntegration>>(
    `/integrations?project_id=${projectId}`,
    token
  )
  const data = response.data || []
  setCache(cacheKey, data, 10 * 60 * 1000)
  return data
}

export async function getAvailableMetrics(
  token: string,
  integrationSlug: string
): Promise<ReporteiMetricDefinition[]> {
  const cacheKey = `metrics_def_${integrationSlug}`
  const cached = getCached<ReporteiMetricDefinition[]>(cacheKey)
  if (cached) return cached

  const response = await reporteiFetch<ReporteiPaginatedResponse<ReporteiMetricDefinition>>(
    `/metrics?integration_slug=${integrationSlug}`,
    token
  )
  const data = response.data || []
  setCache(cacheKey, data, 30 * 60 * 1000) // 30min cache for definitions
  return data
}

export async function getMetricData(
  token: string,
  request: ReporteiMetricRequest
): Promise<ReporteiMetricResponse> {
  const sortedKeys = request.metrics.map((m) => m.reference_key).sort().join(',')
  const cacheKey = `metric_data_${request.integration_id}_${request.start}_${request.end}_${sortedKeys}`
  const cached = getCached<ReporteiMetricResponse>(cacheKey)
  if (cached) return cached

  const response = await reporteiFetch<ReporteiMetricResponse>(
    '/metrics/get-data',
    token,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  )
  setCache(cacheKey, response, 5 * 60 * 1000) // 5min cache for data
  return response
}

export function clearCache(): void {
  cache.clear()
}
