import {
  getProjects,
  getIntegrations,
  getAvailableMetrics,
  getMetricData,
} from './reportei-service'
import {
  SLUG_TO_PLATFORM,
  PLATFORM_METRIC_KEYS,
  METRIC_KEY_NORMALIZATION,
  type PlatformData,
  type ReporteiMetricDefinition,
  type ReporteiMetricRequestItem,
} from './reportei-types'

// ---------------------------------------------------------------------------
// Collect all platform data for a project within a date range
// ---------------------------------------------------------------------------

export async function collectPlatformData(
  token: string,
  projectId: number,
  startDate: string,
  endDate: string,
  comparisonStart?: string,
  comparisonEnd?: string
): Promise<PlatformData[]> {
  // Step 1: Get integrations for the project
  const integrations = await getIntegrations(token, projectId)

  // Step 2: Filter to supported platforms
  const supportedIntegrations = integrations.filter(
    (i) => SLUG_TO_PLATFORM[i.slug] && i.status === 'active'
  )

  // Step 3: For each integration, get available metrics and fetch data
  const results: PlatformData[] = []

  for (const integration of supportedIntegrations) {
    const platformName = SLUG_TO_PLATFORM[integration.slug]
    if (!platformName) continue

    try {
      console.log(`[collectPlatformData] Processing ${platformName} (${integration.slug}, id=${integration.id})`)
      // Get available metric definitions (full objects with id, component, etc.)
      const availableMetrics = await getAvailableMetrics(token, integration.slug)
      const availableByKey = new Map<string, ReporteiMetricDefinition>()
      for (const m of availableMetrics) {
        availableByKey.set(m.reference_key, m)
      }

      // Filter requested metrics to only those available, build request items
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
          // Include optional fields from the metric definition
          if (def.type && (Array.isArray(def.type) ? def.type.length > 0 : true)) item.type = def.type
          if (def.dimensions?.length) item.dimensions = def.dimensions
          if (def.sort?.length) item.sort = def.sort
          if (def.custom && (Array.isArray(def.custom) ? def.custom.length > 0 : Object.keys(def.custom).length > 0)) item.custom = def.custom
          metricsToFetch.push(item)
          keyToId.set(def.id, key)
        }
      }

      console.log(`[collectPlatformData] Available: ${availableMetrics.length}, Desired: ${desiredKeys.length}, ToFetch: ${metricsToFetch.length}`)

      if (metricsToFetch.length === 0) {
        console.warn(`No matching metrics for ${platformName} (${integration.slug}). Available: ${[...availableByKey.keys()].slice(0, 5).join(', ')}...`)
        continue
      }

      console.log(`[collectPlatformData] Fetching ${metricsToFetch.length} metrics...`)
      // Fetch all metrics in a single call
      const request: import('./reportei-types').ReporteiMetricRequest = {
        start: startDate,
        end: endDate,
        integration_id: integration.id,
        metrics: metricsToFetch,
      }
      if (comparisonStart && comparisonEnd) {
        request.comparison_start = comparisonStart
        request.comparison_end = comparisonEnd
      }
      const response = await getMetricData(token, request)

      console.log(`[collectPlatformData] Response keys: ${Object.keys(response.data || {}).length}`)
      // Parse response: response.data is Record<metricId, { values, trend, comparison }>
      const metrics: PlatformData['metrics'] = {
        impressions: 0,
        reach: 0,
        engagement: 0,
        followers: 0,
        growth_rate: 0,
      }
      const previousPeriod: Record<string, number> = {}
      const variationPercent: Record<string, number> = {}
      const trend: Record<string, number[]> = {}

      for (const [metricId, data] of Object.entries(response.data || {})) {
        const rawKey = keyToId.get(metricId) || metricId
        const value = typeof data.values === 'number' ? data.values : 0

        // Store by raw key
        metrics[rawKey] = value

        // Store trend data
        if (data.trend?.data?.length > 0) {
          trend[rawKey] = data.trend.data
        }

        // Normalize to standard name
        // When multiple raw keys map to the same normalized key (e.g.
        // ig:media_saved and ig:media_saved_insights both → "saves"),
        // keep the largest non-zero value so _insights variants win.
        const normalizedKey = METRIC_KEY_NORMALIZATION[rawKey]
        if (normalizedKey) {
          const prev = metrics[normalizedKey] ?? 0
          if (value > prev || prev === 0) {
            metrics[normalizedKey] = value
            if (data.trend?.data?.length > 0) {
              trend[normalizedKey] = data.trend.data
            }
          }

          // Map to top-level standard fields
          if (normalizedKey === 'impressions' && value > metrics.impressions) metrics.impressions = value
          if (normalizedKey === 'reach' && value > metrics.reach) metrics.reach = value
          if (normalizedKey === 'engagement' && value > metrics.engagement) metrics.engagement = value
          if ((normalizedKey === 'followers' || normalizedKey === 'current_followers') && value > metrics.followers) {
            metrics.followers = value
          }
        }

        // Comparison data
        const compValue = data.comparison?.values
        if (compValue !== undefined && compValue !== null) {
          const key = normalizedKey || rawKey
          const existingPrev = previousPeriod[key] ?? 0
          // Keep the largest comparison value (same logic as above)
          if (typeof compValue === 'number' && (compValue > existingPrev || existingPrev === 0)) {
            previousPeriod[key] = compValue
            previousPeriod[rawKey] = compValue

            // Calculate variation percent
            if (compValue > 0) {
              const pct = ((value - compValue) / compValue) * 100
              variationPercent[key] = pct
              variationPercent[rawKey] = pct
            }
          }
        }
      }

      // Calculate growth rate
      if (variationPercent['followers'] !== undefined) {
        metrics.growth_rate = variationPercent['followers']
      } else if (variationPercent['new_followers'] !== undefined) {
        metrics.growth_rate = variationPercent['new_followers']
      }

      // -----------------------------------------------------------------
      // Fetch daily data to build complete trend for all metrics
      // -----------------------------------------------------------------
      const dailyTrend = await collectDailyTrend(
        token,
        integration.id,
        startDate,
        endDate,
        metricsToFetch,
        keyToId
      )
      // Merge daily trend into existing trend (daily overrides period-level)
      for (const [key, values] of Object.entries(dailyTrend)) {
        trend[key] = values
      }

      results.push({
        platform: platformName,
        integrationId: integration.id,
        slug: integration.slug,
        metrics,
        comparison: {
          previous_period: previousPeriod,
          variation_percent: variationPercent,
        },
        trend,
      })
    } catch (error) {
      console.error(`Failed to fetch data for ${platformName} (${integration.slug}):`, error)
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// Fetch day-by-day data to build complete trend arrays
// ---------------------------------------------------------------------------

async function collectDailyTrend(
  token: string,
  integrationId: number,
  startDate: string,
  endDate: string,
  metricsToFetch: import('./reportei-types').ReporteiMetricRequestItem[],
  keyToId: Map<string, string>
): Promise<Record<string, number[]>> {
  // Build list of days
  const days: string[] = []
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    days.push(`${y}-${m}-${day}`)
  }

  if (days.length === 0 || days.length > 90) return {} // Safety limit

  const result: Record<string, number[]> = {}

  // Process in batches of 10 to respect rate limits (30 POST/min)
  const BATCH_SIZE = 10
  for (let i = 0; i < days.length; i += BATCH_SIZE) {
    const batch = days.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (dayStr) => {
        try {
          const response = await getMetricData(token, {
            start: dayStr,
            end: dayStr,
            integration_id: integrationId,
            metrics: metricsToFetch,
          })
          const dayMetrics: Record<string, number> = {}
          for (const [metricId, data] of Object.entries(response.data || {})) {
            const rawKey = keyToId.get(metricId) || metricId
            const value = typeof data.values === 'number' ? data.values : 0
            dayMetrics[rawKey] = value
            const normalizedKey = METRIC_KEY_NORMALIZATION[rawKey]
            if (normalizedKey) {
              // Keep highest value when multiple keys map to same normalized key
              dayMetrics[normalizedKey] = Math.max(dayMetrics[normalizedKey] ?? 0, value)
            }
          }
          return dayMetrics
        } catch {
          return {} as Record<string, number>
        }
      })
    )

    // Accumulate into result arrays
    for (const dayMetrics of batchResults) {
      for (const [key, value] of Object.entries(dayMetrics)) {
        if (!result[key]) result[key] = []
        result[key].push(value)
      }
      // Ensure all known keys get a 0 entry for days with no data
      for (const key of Object.keys(result)) {
        if (!(key in dayMetrics)) {
          result[key].push(0)
        }
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < days.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log(`[collectDailyTrend] Fetched ${days.length} days, trend keys: ${Object.keys(result).filter(k => !k.startsWith('ig:') && !k.startsWith('li:') && !k.startsWith('yt:')).join(', ')}`)
  return result
}

// ---------------------------------------------------------------------------
// Generate automatic insights from platform data
// ---------------------------------------------------------------------------

export function generateInsights(platforms: PlatformData[]): string[] {
  const insights: string[] = []

  if (platforms.length === 0) return ['Nenhum dado disponível para gerar insights.']

  // Growth insights
  for (const p of platforms) {
    const growth = p.comparison.variation_percent['followers']
      ?? p.comparison.variation_percent['new_followers']
    if (growth !== undefined) {
      const sign = growth >= 0 ? '+' : ''
      insights.push(
        `${p.platform} teve ${sign}${growth.toFixed(1)}% de crescimento de seguidores vs período anterior.`
      )
    }
  }

  // Best engagement
  const withEngagement = platforms.filter((p) => p.metrics.engagement > 0)
  if (withEngagement.length > 1) {
    const best = withEngagement.reduce((a, b) =>
      (a.metrics.engagement / Math.max(a.metrics.impressions, 1)) >
      (b.metrics.engagement / Math.max(b.metrics.impressions, 1))
        ? a
        : b
    )
    insights.push(`${best.platform} tem a maior taxa de engajamento entre as plataformas.`)
  } else if (withEngagement.length === 1) {
    const p = withEngagement[0]
    const rate = p.metrics.impressions > 0
      ? ((p.metrics.engagement / p.metrics.impressions) * 100).toFixed(2)
      : '0'
    insights.push(`${p.platform} com taxa de engajamento de ${rate}%.`)
  }

  // Reach / impressions insight
  for (const p of platforms) {
    if (p.metrics.impressions > 0) {
      insights.push(`${p.platform} alcançou ${p.metrics.impressions.toLocaleString('pt-BR')} impressões no período.`)
    }
    if (p.metrics.reach > 0 && p.metrics.reach !== p.metrics.impressions) {
      insights.push(`${p.platform} alcançou ${p.metrics.reach.toLocaleString('pt-BR')} contas no período.`)
    }
  }

  // Saves + shares (Instagram quality)
  for (const p of platforms) {
    const saves = p.metrics['saves'] || 0
    const shares = p.metrics['shares'] || 0
    if (saves > 0 || shares > 0) {
      insights.push(`${p.platform}: ${saves.toLocaleString('pt-BR')} salvamentos e ${shares.toLocaleString('pt-BR')} compartilhamentos — indicadores de conteúdo forte.`)
    }
  }

  // Declining metrics warning
  for (const p of platforms) {
    const impressionChange = p.comparison.variation_percent['impressions']
    if (impressionChange !== undefined && impressionChange < -10) {
      insights.push(
        `Atenção: ${p.platform} com queda de ${Math.abs(impressionChange).toFixed(1)}% em impressões. Revisar estratégia de conteúdo.`
      )
    }
  }

  return insights
}

// ---------------------------------------------------------------------------
// Get all projects (convenience wrapper)
// ---------------------------------------------------------------------------

export async function listProjects(token: string) {
  return getProjects(token)
}

// ---------------------------------------------------------------------------
// Get integrations for a project with platform mapping
// ---------------------------------------------------------------------------

export async function listIntegrationsWithPlatforms(token: string, projectId: number) {
  const integrations = await getIntegrations(token, projectId)
  return integrations.map((i) => ({
    ...i,
    platform: SLUG_TO_PLATFORM[i.slug] || null,
  }))
}
