import { NextResponse } from 'next/server'
import { supabase, type DailyMetricRow } from '@/lib/supabase'
import { getFixedToken } from '@/lib/reportei-service'
import { collectPlatformData } from '@/lib/analytics-service'
import type { PlatformData } from '@/lib/reportei-types'

// POST /api/metrics/data
// Reads from Supabase first, falls back to Reportei if data is incomplete
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { project_id, start, end, comparison_start, comparison_end } = body

    if (!project_id || !start || !end) {
      return NextResponse.json(
        { error: 'project_id, start e end são obrigatórios.' },
        { status: 400 }
      )
    }

    // Try Supabase first
    const [currentRows, comparisonRows] = await Promise.all([
      fetchRows(project_id, start, end),
      comparison_start && comparison_end
        ? fetchRows(project_id, comparison_start, comparison_end)
        : Promise.resolve([]),
    ])

    const expectedDays = daysBetween(start, end)
    const platforms = groupByPlatform(currentRows)
    const hasSufficientData = Object.keys(platforms).length > 0 &&
      Object.values(platforms).some(rows => rows.length >= expectedDays * 0.8) // 80% coverage

    if (hasSufficientData) {
      const compPlatforms = groupByPlatform(comparisonRows)
      const data = buildPlatformDataFromRows(platforms, compPlatforms)

      return NextResponse.json({
        data,
        source: 'supabase',
        period: { start, end },
      })
    }

    // Fallback to Reportei
    console.log(`[metrics/data] Supabase incomplete (${currentRows.length} rows, expected ~${expectedDays}), falling back to Reportei`)
    const token = getFixedToken()
    const platformData = await collectPlatformData(token, project_id, start, end, comparison_start, comparison_end)

    return NextResponse.json({
      data: platformData,
      source: 'reportei',
      period: { start, end },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao coletar dados' },
      { status: 500 }
    )
  }
}

async function fetchRows(projectId: number, start: string, end: string): Promise<DailyMetricRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('project_id', projectId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })

  if (error) {
    console.error('[metrics/data] Supabase query error:', error)
    return []
  }
  return (data || []) as DailyMetricRow[]
}

function groupByPlatform(rows: DailyMetricRow[]): Record<string, DailyMetricRow[]> {
  const groups: Record<string, DailyMetricRow[]> = {}
  for (const row of rows) {
    if (!groups[row.platform]) groups[row.platform] = []
    groups[row.platform].push(row)
  }
  return groups
}

function buildPlatformDataFromRows(
  currentPlatforms: Record<string, DailyMetricRow[]>,
  compPlatforms: Record<string, DailyMetricRow[]>
): PlatformData[] {
  const results: PlatformData[] = []

  for (const [platform, rows] of Object.entries(currentPlatforms)) {
    // Aggregate metrics (sum/max depending on type)
    const avgKeys = new Set(['interaction_rate', 'reels_engagement_rate', 'ctr', 'retention'])
    const totals: Record<string, number> = {}
    const trend: Record<string, number[]> = {}

    // Collect all metric keys
    const allKeys = new Set<string>()
    for (const row of rows) {
      for (const key of Object.keys(row.metrics)) {
        allKeys.add(key)
      }
    }

    // Build totals and trends
    for (const key of allKeys) {
      const values = rows.map(r => r.metrics[key] ?? 0)
      trend[key] = values

      if (avgKeys.has(key)) {
        const nonZero = values.filter(v => v > 0)
        totals[key] = nonZero.length > 0
          ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length
          : 0
      } else if (key === 'followers' || key === 'current_followers') {
        totals[key] = values[values.length - 1] || 0 // last value
      } else {
        totals[key] = values.reduce((a, b) => a + b, 0)
      }
    }

    // Top-level standard fields
    const metrics: PlatformData['metrics'] = {
      impressions: totals.impressions ?? 0,
      reach: totals.reach ?? 0,
      engagement: totals.engagement ?? 0,
      followers: totals.followers ?? totals.current_followers ?? 0,
      growth_rate: 0,
      ...totals,
    }

    // Comparison
    const previousPeriod: Record<string, number> = {}
    const variationPercent: Record<string, number> = {}
    const compRows = compPlatforms[platform]

    if (compRows && compRows.length > 0) {
      for (const key of allKeys) {
        const compValues = compRows.map(r => r.metrics[key] ?? 0)
        let prevTotal: number

        if (avgKeys.has(key)) {
          const nonZero = compValues.filter(v => v > 0)
          prevTotal = nonZero.length > 0
            ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length
            : 0
        } else if (key === 'followers' || key === 'current_followers') {
          prevTotal = compValues[compValues.length - 1] || 0
        } else {
          prevTotal = compValues.reduce((a, b) => a + b, 0)
        }

        previousPeriod[key] = prevTotal
        if (prevTotal > 0) {
          variationPercent[key] = ((totals[key] - prevTotal) / prevTotal) * 100
        }
      }

      if (variationPercent.followers !== undefined) {
        metrics.growth_rate = variationPercent.followers
      } else if (variationPercent.new_followers !== undefined) {
        metrics.growth_rate = variationPercent.new_followers
      }
    }

    results.push({
      platform: platform as PlatformData['platform'],
      integrationId: rows[0]?.integration_id || 0,
      slug: platform.toLowerCase(),
      metrics,
      comparison: {
        previous_period: previousPeriod,
        variation_percent: variationPercent,
      },
      trend,
    })
  }

  return results
}

function daysBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1
}
