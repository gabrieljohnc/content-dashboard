import { NextResponse } from 'next/server'
import { supabase, type DailyMetricRow } from '@/lib/supabase'
import { getFixedToken } from '@/lib/reportei-service'
import { getIntegrations, getAvailableMetrics, getMetricData } from '@/lib/reportei-service'
import {
  SLUG_TO_PLATFORM,
  PLATFORM_METRIC_KEYS,
  METRIC_KEY_NORMALIZATION,
  type ReporteiMetricRequestItem,
  type ReporteiMetricDefinition,
} from '@/lib/reportei-types'

// GET /api/cron/sync-metrics
// Vercel Cron calls this daily, or call manually with ?days=30 for backfill
export async function GET(request: Request) {
  // Verify cron secret (skip in dev)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow without secret in development
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const url = new URL(request.url)
  const daysParam = url.searchParams.get('days')
  const startParam = url.searchParams.get('start')
  const endParam = url.searchParams.get('end')
  const projectIdParam = url.searchParams.get('project_id') || process.env.REPORTEI_PROJECT_ID

  if (!projectIdParam) {
    return NextResponse.json({ error: 'project_id necessário (query param ou REPORTEI_PROJECT_ID env)' }, { status: 400 })
  }

  const projectId = parseInt(projectIdParam, 10)

  // Determine date range
  let startDate: string
  let endDate: string

  if (startParam && endParam) {
    startDate = startParam
    endDate = endParam
  } else {
    const days = daysParam ? parseInt(daysParam, 10) : 1
    const end = new Date()
    end.setDate(end.getDate() - 1) // yesterday
    const start = new Date(end)
    start.setDate(start.getDate() - days + 1)
    startDate = formatDate(start)
    endDate = formatDate(end)
  }

  console.log(`[sync-metrics] Syncing project=${projectId} from ${startDate} to ${endDate}`)

  try {
    const token = getFixedToken()
    const integrations = await getIntegrations(token, projectId)
    const supported = integrations.filter(i => SLUG_TO_PLATFORM[i.slug] && i.status === 'active')

    let synced = 0
    let errors = 0

    for (const integration of supported) {
      const platformName = SLUG_TO_PLATFORM[integration.slug]
      if (!platformName) continue

      try {
        // Get available metric definitions
        const availableMetrics = await getAvailableMetrics(token, integration.slug)
        const availableByKey = new Map<string, ReporteiMetricDefinition>()
        for (const m of availableMetrics) {
          availableByKey.set(m.reference_key, m)
        }

        // Build metrics to fetch
        const desiredKeys = PLATFORM_METRIC_KEYS[platformName] || []
        const metricsToFetch: ReporteiMetricRequestItem[] = []
        const keyToId = new Map<string, string>()

        for (const key of desiredKeys) {
          const def = availableByKey.get(key)
          if (def) {
            const item: ReporteiMetricRequestItem = {
              id: def.id,
              reference_key: def.reference_key,
              component: def.component,
              metrics: def.metrics,
            }
            if (def.type && (Array.isArray(def.type) ? def.type.length > 0 : true)) item.type = def.type
            if (def.dimensions?.length) item.dimensions = def.dimensions
            if (def.sort?.length) item.sort = def.sort
            if (def.custom && (Array.isArray(def.custom) ? def.custom.length > 0 : Object.keys(def.custom).length > 0)) item.custom = def.custom
            metricsToFetch.push(item)
            keyToId.set(def.id, key)
          }
        }

        if (metricsToFetch.length === 0) continue

        // Fetch day by day
        const days = getDaysInRange(startDate, endDate)
        const rows: DailyMetricRow[] = []

        // Process sequentially to respect rate limits (30 POST/min)
        // Batch of 5 with 12s delay = ~25 POST/min
        const BATCH_SIZE = 5
        for (let i = 0; i < days.length; i += BATCH_SIZE) {
          const batch = days.slice(i, i + BATCH_SIZE)

          const batchResults = await Promise.all(
            batch.map(async (dayStr) => {
              try {
                const response = await getMetricData(token, {
                  start: dayStr,
                  end: dayStr,
                  integration_id: integration.id,
                  metrics: metricsToFetch,
                })

                const dayMetrics: Record<string, number> = {}
                for (const [metricId, data] of Object.entries(response.data || {})) {
                  const rawKey = keyToId.get(metricId) || metricId
                  const value = typeof data.values === 'number' ? data.values : 0
                  const normalizedKey = METRIC_KEY_NORMALIZATION[rawKey]
                  if (normalizedKey) {
                    dayMetrics[normalizedKey] = Math.max(dayMetrics[normalizedKey] ?? 0, value)
                  }
                }

                return { date: dayStr, metrics: dayMetrics }
              } catch (err: any) {
                console.error(`[sync-metrics] Day ${dayStr} error:`, err.message)
                errors++
                return null
              }
            })
          )

          for (const result of batchResults) {
            if (result) {
              rows.push({
                project_id: projectId,
                platform: platformName,
                date: result.date,
                metrics: result.metrics,
                integration_id: integration.id,
              })
            }
          }

          // Rate limit delay between batches (30 POST/min limit)
          if (i + BATCH_SIZE < days.length) {
            await new Promise(resolve => setTimeout(resolve, 12000))
          }
        }

        // Upsert all rows
        if (rows.length > 0) {
          const { error: upsertError } = await supabase
            .from('daily_metrics')
            .upsert(rows, { onConflict: 'project_id,platform,date' })

          if (upsertError) {
            console.error(`[sync-metrics] Upsert error for ${platformName}:`, upsertError)
            errors += rows.length
          } else {
            synced += rows.length
          }
        }

        console.log(`[sync-metrics] ${platformName}: ${rows.length} days synced`)
      } catch (err) {
        console.error(`[sync-metrics] Error for ${platformName}:`, err)
        errors++
      }
    }

    return NextResponse.json({
      synced,
      errors,
      range: { start: startDate, end: endDate },
      platforms: supported.map(i => SLUG_TO_PLATFORM[i.slug]),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = []
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    days.push(formatDate(d))
  }
  return days
}
