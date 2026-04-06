'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Trash2Icon,
  FileTextIcon,
  InfoIcon,
  DownloadIcon,
  Loader2Icon,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip as UiTooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { ReporteiConfig, useReporteiConfig } from '@/components/analytics/reportei-config'
import { usePlatformData } from '@/hooks/use-reportei'
import type { PlatformData } from '@/lib/reportei-types'
import {
  mockInstagramMetrics,
  mockLinkedInMetrics,
  mockYouTubeMetrics,
  mockTopPostsInstagram,
  mockTopPostsLinkedIn,
  mockTopPostsYouTube,
} from '@/lib/mock-data'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/lib/constants'
import { useLocalStorage } from '@/hooks/use-local-storage'
import type { Platform } from '@/lib/types'

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

interface DateRange {
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
}

interface DateRanges {
  analise: DateRange
  comparacao: DateRange
}

type ActiveTab = 'instagram' | 'linkedin' | 'youtube' | 'comparativo'

const TAB_OPTIONS: { value: ActiveTab; label: string; color?: string }[] = [
  { value: 'instagram', label: 'Instagram', color: PLATFORM_COLORS.instagram },
  { value: 'linkedin', label: 'LinkedIn', color: PLATFORM_COLORS.linkedin },
  { value: 'youtube', label: 'YouTube', color: PLATFORM_COLORS.youtube },
  { value: 'comparativo', label: 'Comparativo' },
]

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildRanges(endDate: Date, days: number = 30): DateRanges {
  const end = new Date(endDate)
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  const compEnd = new Date(start)
  compEnd.setDate(compEnd.getDate() - 1)
  const compStart = new Date(compEnd)
  compStart.setDate(compStart.getDate() - days + 1)
  return {
    analise: { start: toDateStr(start), end: toDateStr(end) },
    comparacao: { start: toDateStr(compStart), end: toDateStr(compEnd) },
  }
}

function daysBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('pt-BR')
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

function formatChange(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function formatChartDate(dateStr: string): string {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

function trendToChartData(
  trendValues: number[] | undefined,
  range: DateRange
): { label: string; value: number }[] {
  if (!trendValues || trendValues.length === 0) return []
  const start = new Date(range.start + 'T00:00:00')
  return trendValues.map((value, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return { label: `${day}/${month}`, value }
  })
}

// ---------------------------------------------------------------------------
// Shared Components
// ---------------------------------------------------------------------------

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-zinc-300">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}
        </p>
      ))}
    </div>
  )
}

function DateRangeSelector({
  ranges,
  onChange,
}: {
  ranges: DateRanges
  onChange: (r: DateRanges) => void
}) {
  const analysisDays = daysBetween(ranges.analise.start, ranges.analise.end)
  const compDays = daysBetween(ranges.comparacao.start, ranges.comparacao.end)

  function setPreset(days: number) {
    onChange(buildRanges(new Date(), days))
  }

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:gap-6">
          {/* Período de Análise */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Período de Análise
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={ranges.analise.start}
                onChange={(e) =>
                  onChange({ ...ranges, analise: { ...ranges.analise, start: e.target.value } })
                }
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-0 flex-1 md:flex-none"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <input
                type="date"
                value={ranges.analise.end}
                onChange={(e) =>
                  onChange({ ...ranges, analise: { ...ranges.analise, end: e.target.value } })
                }
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-0 flex-1 md:flex-none"
              />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                ({analysisDays}d)
              </span>
            </div>
          </div>

          {/* Período de Comparação */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Período de Comparação
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={ranges.comparacao.start}
                onChange={(e) =>
                  onChange({ ...ranges, comparacao: { ...ranges.comparacao, start: e.target.value } })
                }
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0 flex-1 md:flex-none"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <input
                type="date"
                value={ranges.comparacao.end}
                onChange={(e) =>
                  onChange({ ...ranges, comparacao: { ...ranges.comparacao, end: e.target.value } })
                }
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0 flex-1 md:flex-none"
              />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                ({compDays}d)
              </span>
            </div>
          </div>

          {/* Atalhos */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Atalhos
            </label>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {[
                { label: '7d', days: 7 },
                { label: '30d', days: 30 },
                { label: '90d', days: 90 },
              ].map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setPreset(opt.days)}
                  className={[
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    analysisDays === opt.days
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


function MetricCard({
  label,
  value,
  change,
  isKey,
  sublabel,
  tooltip,
}: {
  label: string
  value: string
  change?: number
  isKey?: boolean
  sublabel?: string
  tooltip?: string
}) {
  return (
    <Card className={isKey ? 'ring-1 ring-amber-500/30' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          {tooltip && (
            <TooltipProvider>
              <UiTooltip>
                <TooltipTrigger
                  className="text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-help"
                  render={<span />}
                >
                  <InfoIcon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-center leading-snug">
                  {tooltip}
                </TooltipContent>
              </UiTooltip>
            </TooltipProvider>
          )}
          {isKey && (
            <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[10px] px-1.5 py-0">
              KPI
            </Badge>
          )}
        </div>
        {sublabel && (
          <CardDescription className="text-xs">{sublabel}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {change !== undefined && (
          <p
            className={[
              'mt-1 text-xs font-medium',
              change >= 0 ? 'text-emerald-400' : 'text-red-400',
            ].join(' ')}
          >
            {formatChange(change)} vs. período anterior
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Date filtering helpers
// ---------------------------------------------------------------------------

function filterByDateRanges<T extends { data: string }>(items: T[], ranges: DateRanges): { current: T[]; previous: T[] } {
  return {
    current: items.filter((m) => m.data >= ranges.analise.start && m.data <= ranges.analise.end),
    previous: items.filter((m) => m.data >= ranges.comparacao.start && m.data <= ranges.comparacao.end),
  }
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

function dailyData<T extends { data: string }>(
  items: T[],
  _totalDays: number,
  getValue: (item: T) => number,
  mode: 'sum' | 'avg' = 'sum'
): { label: string; value: number }[] {
  const byDate: Record<string, number[]> = {}
  for (const item of items) {
    if (!byDate[item.data]) byDate[item.data] = []
    byDate[item.data].push(getValue(item))
  }
  return Object.keys(byDate).sort().map((date) => {
    const vals = byDate[date]
    const value = mode === 'sum'
      ? vals.reduce((a, b) => a + b, 0)
      : vals.length > 0
        ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
        : 0
    return { label: formatChartDate(date), value }
  })
}

// ---------------------------------------------------------------------------
// Chart styling
// ---------------------------------------------------------------------------

const axisStyle = { fill: '#71717a', fontSize: 11 }
const axisSmallStyle = { fill: '#71717a', fontSize: 10 }
const gridStyle = { stroke: '#3f3f46', strokeDasharray: '3 3' }
const chartMargin = { top: 4, right: 8, left: 0, bottom: 0 }
const legendStyle = { fontSize: 11, color: '#a1a1aa' }
const cursorStyle = { fill: 'rgba(255,255,255,0.04)' }
const activeDotCurrent = { r: 4, strokeWidth: 0 }
const activeDotPrevious = { r: 3, strokeWidth: 0, fill: '#71717a' }
const barRadius: [number, number, number, number] = [3, 3, 0, 0]
const barRadiusLg: [number, number, number, number] = [4, 4, 0, 0]

function ChartCard({
  title,
  children,
  isMounted,
}: {
  title: string
  children: React.ReactNode
  isMounted: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isMounted ? children : <div className="h-[240px] animate-pulse rounded-lg bg-muted/30" />}
      </CardContent>
    </Card>
  )
}

function mergeWithComparison(
  current: { label: string; value: number }[],
  previous: { label: string; value: number }[]
): { label: string; value: number; anterior: number }[] {
  return current.map((item, i) => ({
    ...item,
    anterior: previous[i]?.value ?? 0,
  }))
}

function SimpleLineChart({
  data,
  comparisonData,
  color,
  suffix,
  isMounted,
}: {
  data: { label: string; value: number }[]
  comparisonData?: { label: string; value: number }[]
  color: string
  suffix?: string
  isMounted: boolean
}) {
  if (!isMounted) return <div className="h-[240px] animate-pulse rounded-lg bg-muted/30" />
  const merged = comparisonData ? mergeWithComparison(data, comparisonData) : data
  const many = data.length > 14
  const xInterval = data.length > 60 ? Math.floor(data.length / 10) : data.length > 30 ? Math.floor(data.length / 8) : data.length > 14 ? 2 : 0
  return (
    <ResponsiveContainer width="100%" height={many ? 270 : 240}>
      <LineChart data={merged} margin={many ? { ...chartMargin, bottom: 16 } : chartMargin}>
        <CartesianGrid {...gridStyle} />
        <XAxis
          dataKey="label"
          tick={many ? axisSmallStyle : axisStyle}
          axisLine={false}
          tickLine={false}
          interval={xInterval}
          angle={many ? -35 : 0}
          textAnchor={many ? 'end' : 'middle'}
          height={many ? 45 : undefined}
        />
        <YAxis
          tick={axisStyle}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => suffix ? `${v}${suffix}` : formatNumber(v)}
          width={52}
        />
        <Tooltip content={<DarkTooltip />} />
        {comparisonData && (
          <Legend wrapperStyle={legendStyle} />
        )}
        {comparisonData && (
          <Line
            type="monotone"
            dataKey="anterior"
            name="Período Anterior"
            stroke="#71717a"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            activeDot={activeDotPrevious}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          name="Período Atual"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          activeDot={activeDotCurrent}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SimpleBarChart({
  data,
  comparisonData,
  color,
  suffix,
  isMounted,
}: {
  data: { label: string; value: number }[]
  comparisonData?: { label: string; value: number }[]
  color: string
  suffix?: string
  isMounted: boolean
}) {
  if (!isMounted) return <div className="h-[240px] animate-pulse rounded-lg bg-muted/30" />
  const merged = comparisonData ? mergeWithComparison(data, comparisonData) : data
  const many = data.length > 14
  const xInterval = data.length > 60 ? Math.floor(data.length / 10) : data.length > 30 ? Math.floor(data.length / 8) : data.length > 14 ? 2 : 0
  return (
    <ResponsiveContainer width="100%" height={many ? 270 : 240}>
      <BarChart data={merged} margin={many ? { ...chartMargin, bottom: 16 } : chartMargin}>
        <CartesianGrid {...gridStyle} />
        <XAxis
          dataKey="label"
          tick={many ? axisSmallStyle : axisStyle}
          axisLine={false}
          tickLine={false}
          interval={xInterval}
          angle={many ? -35 : 0}
          textAnchor={many ? 'end' : 'middle'}
          height={many ? 45 : undefined}
        />
        <YAxis
          tick={axisStyle}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => suffix ? `${v}${suffix}` : formatNumber(v)}
          width={52}
        />
        <Tooltip content={<DarkTooltip />} cursor={cursorStyle} />
        {comparisonData && (
          <Legend wrapperStyle={legendStyle} />
        )}
        <Bar dataKey="value" name="Período Atual" fill={color} radius={barRadius} maxBarSize={32} />
        {comparisonData && (
          <Bar dataKey="anterior" name="Período Anterior" fill="#52525b" radius={barRadius} maxBarSize={32} />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ===========================================================================
// REAL DATA CHARTS (Reportei integration)
// ===========================================================================

interface ComparisonItem {
  label: string
  atual: number
  anterior: number
}

interface DonutItem {
  name: string
  value: number
  color: string
}

const DONUT_PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

function buildComparisonData(
  metrics: Record<string, number>,
  previous: Record<string, number>,
  keys: { key: string; label: string }[]
): ComparisonItem[] {
  return keys
    .map(({ key, label }) => ({
      label,
      atual: metrics[key] || 0,
      anterior: previous[key] || 0,
    }))
    .filter((d) => d.atual > 0 || d.anterior > 0)
}

function buildDonutData(
  metrics: Record<string, number>,
  keys: { key: string; label: string }[]
): DonutItem[] {
  return keys
    .map(({ key, label }, i) => ({
      name: label,
      value: metrics[key] || 0,
      color: DONUT_PALETTE[i % DONUT_PALETTE.length],
    }))
    .filter((d) => d.value > 0)
}

function ComparisonBarChart({
  data,
  color,
  isMounted,
}: {
  data: ComparisonItem[]
  color: string
  isMounted: boolean
}) {
  if (!isMounted) return <div className="h-[300px] animate-pulse rounded-lg bg-muted/30" />
  if (data.length === 0) return <p className="text-xs text-muted-foreground text-center py-8">Sem dados para exibir</p>
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="label" tick={axisSmallStyle} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={56} />
        <Tooltip content={<DarkTooltip />} />
        <Legend wrapperStyle={legendStyle} />
        <Bar dataKey="atual" name="Período Atual" fill={color} radius={barRadiusLg} />
        <Bar dataKey="anterior" name="Período Anterior" fill="#52525b" radius={barRadiusLg} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function DonutChart({
  data,
  isMounted,
  centerLabel,
  centerValue,
}: {
  data: DonutItem[]
  isMounted: boolean
  centerLabel?: string
  centerValue?: string
}) {
  if (!isMounted) return <div className="h-[260px] animate-pulse rounded-lg bg-muted/30" />
  if (data.length === 0) return <p className="text-xs text-muted-foreground text-center py-8">Sem dados para exibir</p>
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as DonutItem
              const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
              return (
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
                  <p className="font-medium" style={{ color: d.color }}>{d.name}</p>
                  <p className="text-zinc-300">{formatNumber(d.value)} ({pct}%)</p>
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-lg font-bold">{centerValue || formatNumber(total)}</p>
          <p className="text-[10px] text-muted-foreground">{centerLabel}</p>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[10px] text-muted-foreground">{d.name}: {formatNumber(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalMetricsChart({
  data,
  color,
  isMounted,
}: {
  data: { label: string; value: number; change?: number }[]
  color: string
  isMounted: boolean
}) {
  if (!isMounted) return <div className="h-[300px] animate-pulse rounded-lg bg-muted/30" />
  const filtered = data.filter((d) => d.value > 0)
  if (filtered.length === 0) return <p className="text-xs text-muted-foreground text-center py-8">Sem dados para exibir</p>
  const sorted = [...filtered].sort((a, b) => b.value - a.value)
  const max = sorted[0]?.value || 1
  return (
    <div className="flex flex-col gap-2.5 px-1">
      {sorted.map((item) => {
        const pct = (item.value / max) * 100
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-28 shrink-0 text-right">{item.label}</span>
            <div className="flex-1 h-7 bg-zinc-800/50 rounded-md overflow-hidden relative">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-zinc-200">
                {formatNumber(item.value)}
              </span>
            </div>
            {item.change !== undefined && (
              <span className={`text-[10px] font-medium w-14 shrink-0 ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatChange(item.change)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function buildHorizontalData(
  metrics: Record<string, number>,
  variation: Record<string, number>,
  keys: { key: string; label: string }[]
): { label: string; value: number; change?: number }[] {
  return keys
    .map(({ key, label }) => ({
      label,
      value: metrics[key] || 0,
      change: variation[key],
    }))
    .filter((d) => d.value > 0)
}

// ===========================================================================
// INSTAGRAM SECTION
// ===========================================================================

function RealDataLoading() {
  return (
    <Card>
      <CardContent className="py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="size-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando dados reais do Reportei...</p>
        </div>
      </CardContent>
    </Card>
  )
}

function RealDataEmpty({ platform, error }: { platform: string; error?: string | null }) {
  return (
    <Card className="border-amber-900/30">
      <CardContent className="py-6 text-center">
        {error ? (
          <>
            <p className="text-sm text-red-400">Erro ao buscar dados: {error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tente reiniciar o servidor de desenvolvimento e limpar o cache da API.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Nenhum dado encontrado para <span className="font-medium text-foreground">{platform}</span> na resposta do Reportei.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Verifique se a integração está ativa no projeto selecionado.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function InstagramAnalytics({ ranges, isMounted, platformData, isRealData, realDataLoading, realDataError }: { ranges: DateRanges; isMounted: boolean; platformData?: PlatformData; isRealData?: boolean; realDataLoading?: boolean; realDataError?: string | null }) {
  const color = PLATFORM_COLORS.instagram
  const totalDays = daysBetween(ranges.analise.start, ranges.analise.end)

  const mockFiltered = useMemo(
    () => filterByDateRanges(mockInstagramMetrics, ranges),
    [ranges]
  )
  const current = isRealData ? [] as typeof mockFiltered.current : mockFiltered.current
  const previous = isRealData ? [] as typeof mockFiltered.previous : mockFiltered.previous

  const zeroMetrics = {
    alcance: 0, alcancePrev: 0, salvamentos: 0, salvamentosPrev: 0,
    compartilhamentos: 0, compartilhamentosPrev: 0, watchTime: 0, watchTimePrev: 0,
    cliquesLink: 0, cliquesLinkPrev: 0, interacoesDirect: 0, interacoesDirectPrev: 0, seguidores: 0,
  }

  const metrics = useMemo(() => {
    if (isRealData) {
      if (!platformData) return zeroMetrics
      const m = platformData.metrics
      const prev = platformData.comparison.previous_period || {}
      return {
        alcance: m.reach || 0,
        alcancePrev: prev.reach || 0,
        salvamentos: m.saves || 0,
        salvamentosPrev: prev.saves || 0,
        compartilhamentos: m.shares || 0,
        compartilhamentosPrev: prev.shares || 0,
        watchTime: m.watch_time || m.reels_watch_time || 0,
        watchTimePrev: prev.watch_time || prev.reels_watch_time || 0,
        cliquesLink: m.clicks || 0,
        cliquesLinkPrev: prev.clicks || 0,
        interacoesDirect: m.direct_interactions || m.story_replies || 0,
        interacoesDirectPrev: prev.direct_interactions || prev.story_replies || 0,
        seguidores: m.followers || 0,
      }
    }

    const sum = (arr: typeof current, key: keyof typeof current[0]) =>
      arr.reduce((s, m) => s + (m[key] as number), 0)
    const avg = (arr: typeof current, key: keyof typeof current[0]) =>
      arr.length > 0 ? sum(arr, key) / arr.length : 0

    return {
      alcance: sum(current, 'alcance'),
      alcancePrev: sum(previous, 'alcance'),
      salvamentos: sum(current, 'salvamentos'),
      salvamentosPrev: sum(previous, 'salvamentos'),
      compartilhamentos: sum(current, 'compartilhamentos'),
      compartilhamentosPrev: sum(previous, 'compartilhamentos'),
      watchTime: sum(current, 'watchTime'),
      watchTimePrev: sum(previous, 'watchTime'),
      cliquesLink: sum(current, 'cliquesLink'),
      cliquesLinkPrev: sum(previous, 'cliquesLink'),
      interacoesDirect: sum(current, 'interacoesDirect'),
      interacoesDirectPrev: sum(previous, 'interacoesDirect'),
      seguidores: current.length > 0 ? current[current.length - 1].seguidores : 0,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, previous, platformData, isRealData])

  const compDays = daysBetween(ranges.comparacao.start, ranges.comparacao.end)

  const trend = platformData?.trend
  const alcanceData = useMemo(() => isRealData ? trendToChartData(trend?.reach, ranges.analise) : dailyData(current, totalDays, (m) => m.alcance), [current, totalDays, isRealData, trend, ranges.analise])
  const alcanceCompData = useMemo(() => isRealData ? [] as { label: string; value: number }[] : dailyData(previous, compDays, (m) => m.alcance), [previous, compDays, isRealData])
  const salvamentosData = useMemo(() => isRealData ? trendToChartData(trend?.saves, ranges.analise) : dailyData(current, totalDays, (m) => m.salvamentos), [current, totalDays, isRealData, trend, ranges.analise])
  const salvamentosCompData = useMemo(() => isRealData ? [] as { label: string; value: number }[] : dailyData(previous, compDays, (m) => m.salvamentos), [previous, compDays, isRealData])
  const watchTimeData = useMemo(() => isRealData ? trendToChartData(trend?.watch_time || trend?.reels_watch_time, ranges.analise) : dailyData(current, totalDays, (m) => m.watchTime), [current, totalDays, isRealData, trend, ranges.analise])
  const watchTimeCompData = useMemo(() => isRealData ? [] as { label: string; value: number }[] : dailyData(previous, compDays, (m) => m.watchTime), [previous, compDays, isRealData])
  const cliquesData = useMemo(() => isRealData ? trendToChartData(trend?.clicks, ranges.analise) : dailyData(current, totalDays, (m) => m.cliquesLink), [current, totalDays, isRealData, trend, ranges.analise])
  const cliquesCompData = useMemo(() => isRealData ? [] as { label: string; value: number }[] : dailyData(previous, compDays, (m) => m.cliquesLink), [previous, compDays, isRealData])

  return (
    <div className="flex flex-col gap-6">
      {/* Platform Header */}
      <div className="flex items-center gap-3">
        <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
        <div>
          <h2 className="text-lg font-semibold">Instagram — Atenção e Distribuição</h2>
          <p className="text-xs text-muted-foreground">Foco: parar o scroll + engajar rápido</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Alcance"
          sublabel="Distribuição"
          value={formatNumber(metrics.alcance)}
          change={calcChange(metrics.alcance, metrics.alcancePrev)}
          tooltip="Contas únicas que viram seu conteúdo. Vem do Instagram Insights — mede o poder de distribuição do algoritmo."
          isKey
        />
        <MetricCard
          label="Salvamentos"
          sublabel="Qualidade real"
          value={formatNumber(metrics.salvamentos)}
          change={calcChange(metrics.salvamentos, metrics.salvamentosPrev)}
          tooltip="Vezes que alguém salvou seu post para ver depois. Instagram Insights — indica conteúdo de alto valor percebido."
          isKey
        />
        <MetricCard
          label="Compartilhamentos"
          sublabel="Conteúdo forte"
          value={formatNumber(metrics.compartilhamentos)}
          change={calcChange(metrics.compartilhamentos, metrics.compartilhamentosPrev)}
          tooltip="Envios por DM ou compartilhamentos nos Stories. Instagram Insights — sinal forte de conteúdo relevante."
          isKey
        />
        <MetricCard
          label="Watch Time"
          sublabel="Tempo de tela"
          value={`${formatNumber(metrics.watchTime)}h`}
          change={calcChange(metrics.watchTime, metrics.watchTimePrev)}
          tooltip="Total de horas que o público assistiu seus Reels e vídeos. Instagram Insights — o algoritmo prioriza conteúdo que mantém as pessoas na plataforma."
          isKey
        />
        <MetricCard
          label="Cliques no Link"
          sublabel="Intenção"
          value={formatNumber(metrics.cliquesLink)}
          change={calcChange(metrics.cliquesLink, metrics.cliquesLinkPrev)}
          tooltip="Cliques no link da bio ou stickers de link. Instagram Insights — mede intenção real de ação."
        />
        <MetricCard
          label="Interações no Direct"
          value={formatNumber(metrics.interacoesDirect)}
          change={calcChange(metrics.interacoesDirect, metrics.interacoesDirectPrev)}
          tooltip="Respostas a Stories e mensagens diretas geradas pelo conteúdo. Instagram Insights — sinal de conexão real com a audiência e alto valor para o algoritmo."
        />
      </div>

      {/* Charts */}
      {realDataLoading ? (
        <RealDataLoading />
      ) : isRealData && !platformData ? (
        <RealDataEmpty platform="Instagram" error={realDataError} />
      ) : alcanceData.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Alcance (Distribuição)" isMounted={isMounted}>
            <SimpleLineChart data={alcanceData} comparisonData={alcanceCompData} color={color} isMounted={isMounted} />
          </ChartCard>
          <ChartCard title="Salvamentos (Qualidade)" isMounted={isMounted}>
            <SimpleBarChart data={salvamentosData} comparisonData={salvamentosCompData} color={color} isMounted={isMounted} />
          </ChartCard>
          <ChartCard title="Watch Time (horas)" isMounted={isMounted}>
            <SimpleBarChart data={watchTimeData} comparisonData={watchTimeCompData} color={color} isMounted={isMounted} />
          </ChartCard>
          <ChartCard title="Cliques no Link (Intenção)" isMounted={isMounted}>
            <SimpleBarChart data={cliquesData} comparisonData={cliquesCompData} color={color} isMounted={isMounted} />
          </ChartCard>
        </div>
      ) : null}
    </div>
  )
}

// ===========================================================================
// LINKEDIN SECTION
// ===========================================================================

function LinkedInAnalytics({ ranges, isMounted, platformData, isRealData, realDataLoading, realDataError }: { ranges: DateRanges; isMounted: boolean; platformData?: PlatformData; isRealData?: boolean; realDataLoading?: boolean; realDataError?: string | null }) {
  const color = PLATFORM_COLORS.linkedin
  const totalDays = daysBetween(ranges.analise.start, ranges.analise.end)

  const mockFiltered = useMemo(
    () => filterByDateRanges(mockLinkedInMetrics, ranges),
    [ranges]
  )
  const current = isRealData ? [] as typeof mockFiltered.current : mockFiltered.current
  const previous = isRealData ? [] as typeof mockFiltered.previous : mockFiltered.previous

  const zeroMetrics = {
    impressoes: 0, impressoesPrev: 0, comentarios: 0, comentariosPrev: 0,
    reacoes: 0, reacoesPrev: 0, ctr: 0, ctrPrev: 0,
    seguidoresQualificados: 0, seguidoresQualificadosPrev: 0,
    compartilhamentos: 0, compartilhamentosPrev: 0, seguidores: 0,
  }

  const metrics = useMemo(() => {
    if (isRealData) {
      if (!platformData) return zeroMetrics
      const m = platformData.metrics
      const prev = platformData.comparison.previous_period || {}
      return {
        impressoes: m.impressions || 0,
        impressoesPrev: prev.impressions || 0,
        comentarios: m.comments || 0,
        comentariosPrev: prev.comments || 0,
        reacoes: m.reactions || 0,
        reacoesPrev: prev.reactions || 0,
        ctr: m.ctr || 0,
        ctrPrev: prev.ctr || 0,
        seguidoresQualificados: m.new_followers || 0,
        seguidoresQualificadosPrev: prev.new_followers || 0,
        compartilhamentos: m.shares || 0,
        compartilhamentosPrev: prev.shares || 0,
        seguidores: m.followers || 0,
      }
    }

    const sum = (arr: typeof current, key: keyof typeof current[0]) =>
      arr.reduce((s, m) => s + (m[key] as number), 0)
    const avg = (arr: typeof current, key: keyof typeof current[0]) =>
      arr.length > 0 ? sum(arr, key) / arr.length : 0

    return {
      impressoes: sum(current, 'impressoes'),
      impressoesPrev: sum(previous, 'impressoes'),
      comentarios: sum(current, 'comentarios'),
      comentariosPrev: sum(previous, 'comentarios'),
      reacoes: sum(current, 'reacoes'),
      reacoesPrev: sum(previous, 'reacoes'),
      ctr: avg(current, 'ctr'),
      ctrPrev: avg(previous, 'ctr'),
      seguidoresQualificados: sum(current, 'seguidoresQualificados'),
      seguidoresQualificadosPrev: sum(previous, 'seguidoresQualificados'),
      compartilhamentos: sum(current, 'compartilhamentos'),
      compartilhamentosPrev: sum(previous, 'compartilhamentos'),
      seguidores: current.length > 0 ? current[current.length - 1].seguidores : 0,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, previous, platformData, isRealData])

  const compDays = daysBetween(ranges.comparacao.start, ranges.comparacao.end)

  const trend = platformData?.trend
  const emptyChart = [] as { label: string; value: number }[]
  const impressoesData = useMemo(() => isRealData ? trendToChartData(trend?.impressions, ranges.analise) : dailyData(current, totalDays, (m) => m.impressoes), [current, totalDays, isRealData, trend, ranges.analise])
  const impressoesCompData = useMemo(() => isRealData ? emptyChart : dailyData(previous, compDays, (m) => m.impressoes), [previous, compDays, isRealData])
  const comentariosData = useMemo(() => isRealData ? trendToChartData(trend?.comments, ranges.analise) : dailyData(current, totalDays, (m) => m.comentarios), [current, totalDays, isRealData, trend, ranges.analise])
  const comentariosCompData = useMemo(() => isRealData ? emptyChart : dailyData(previous, compDays, (m) => m.comentarios), [previous, compDays, isRealData])
  const ctrData = useMemo(() => isRealData ? trendToChartData(trend?.ctr, ranges.analise) : dailyData(current, totalDays, (m) => m.ctr, 'avg'), [current, totalDays, isRealData, trend, ranges.analise])
  const ctrCompData = useMemo(() => isRealData ? emptyChart : dailyData(previous, compDays, (m) => m.ctr, 'avg'), [previous, compDays, isRealData])
  const segQualData = useMemo(() => isRealData ? trendToChartData(trend?.new_followers, ranges.analise) : dailyData(current, totalDays, (m) => m.seguidoresQualificados), [current, totalDays, isRealData, trend, ranges.analise])
  const segQualCompData = useMemo(() => isRealData ? emptyChart : dailyData(previous, compDays, (m) => m.seguidoresQualificados), [previous, compDays, isRealData])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
        <div>
          <h2 className="text-lg font-semibold">LinkedIn — Autoridade e Conversão Leve</h2>
          <p className="text-xs text-muted-foreground">Foco: credibilidade + conversa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Impressões"
          sublabel="Distribuição no feed"
          value={formatNumber(metrics.impressoes)}
          change={calcChange(metrics.impressoes, metrics.impressoesPrev)}
          tooltip="Vezes que seu conteúdo apareceu no feed. LinkedIn Analytics — mede o alcance orgânico da sua página."
          isKey
        />
        <MetricCard
          label="Comentários"
          sublabel="Profundidade"
          value={formatNumber(metrics.comentarios)}
          change={calcChange(metrics.comentarios, metrics.comentariosPrev)}
          tooltip="Total de comentários nos posts. LinkedIn Analytics — comentários geram mais distribuição que reações."
          isKey
        />
        <MetricCard
          label="CTR"
          sublabel="Interesse real"
          value={formatPercent(metrics.ctr)}
          change={calcChange(metrics.ctr, metrics.ctrPrev)}
          tooltip="Taxa de cliques sobre impressões. LinkedIn Analytics — mostra quantas pessoas quiseram saber mais."
          isKey
        />
        <MetricCard
          label="Seguidores Qualif."
          sublabel="Crescimento real"
          value={formatNumber(metrics.seguidoresQualificados)}
          change={calcChange(metrics.seguidoresQualificados, metrics.seguidoresQualificadosPrev)}
          tooltip="Novos seguidores do setor de energia/indústria. LinkedIn Analytics — crescimento que gera oportunidades reais."
          isKey
        />
        <MetricCard
          label="Reações"
          sublabel="Engajamento leve"
          value={formatNumber(metrics.reacoes)}
          change={calcChange(metrics.reacoes, metrics.reacoesPrev)}
          tooltip="Curtidas e reações (aplausos, apoio, etc). LinkedIn Analytics — engajamento rápido, menor peso que comentários."
        />
        <MetricCard
          label="Compartilhamentos"
          value={formatNumber(metrics.compartilhamentos)}
          change={calcChange(metrics.compartilhamentos, metrics.compartilhamentosPrev)}
          tooltip="Repostagens do seu conteúdo. LinkedIn Analytics — amplifica alcance para a rede dos compartilhadores."
        />
      </div>

      {realDataLoading ? (
        <RealDataLoading />
      ) : isRealData && !platformData ? (
        <RealDataEmpty platform="LinkedIn" error={realDataError} />
      ) : impressoesData.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Impressões (Distribuição no Feed)" isMounted={isMounted}>
            <SimpleLineChart data={impressoesData} comparisonData={impressoesCompData} color={color} isMounted={isMounted} />
          </ChartCard>
          <ChartCard title="Comentários (Profundidade)" isMounted={isMounted}>
            <SimpleBarChart data={comentariosData} comparisonData={comentariosCompData} color={color} isMounted={isMounted} />
          </ChartCard>
          <ChartCard title="CTR — Click-Through Rate (%)" isMounted={isMounted}>
            <SimpleLineChart data={ctrData} comparisonData={ctrCompData} color={color} suffix="%" isMounted={isMounted} />
          </ChartCard>
          <ChartCard title="Seguidores Qualificados (Novos)" isMounted={isMounted}>
            <SimpleBarChart data={segQualData} comparisonData={segQualCompData} color={color} isMounted={isMounted} />
          </ChartCard>
        </div>
      ) : null}
    </div>
  )
}

// ===========================================================================
// YOUTUBE SECTION
// ===========================================================================

function YouTubeAnalytics({ ranges, isMounted, platformData, isRealData, realDataLoading, realDataError }: { ranges: DateRanges; isMounted: boolean; platformData?: PlatformData; isRealData?: boolean; realDataLoading?: boolean; realDataError?: string | null }) {
  const color = PLATFORM_COLORS.youtube
  const totalDays = daysBetween(ranges.analise.start, ranges.analise.end)

  const mockFiltered = useMemo(
    () => filterByDateRanges(mockYouTubeMetrics, ranges),
    [ranges]
  )
  const current = isRealData ? [] as typeof mockFiltered.current : mockFiltered.current
  const previous = isRealData ? [] as typeof mockFiltered.previous : mockFiltered.previous

  const zeroMetrics = {
    ctrThumbnail: 0, ctrThumbnailPrev: 0, retencaoMedia: 0, retencaoMediaPrev: 0,
    watchTime: 0, watchTimePrev: 0, inscricoesPorVideo: 0, inscricoesPorVideoPrev: 0,
    visualizacoes: 0, visualizacoesPrev: 0, inscritos: 0,
  }

  const metrics = useMemo(() => {
    if (isRealData) {
      if (!platformData) return zeroMetrics
      const m = platformData.metrics
      const prev = platformData.comparison.previous_period || {}
      return {
        ctrThumbnail: m.ctr || 0,
        ctrThumbnailPrev: prev.ctr || 0,
        retencaoMedia: m.retention || 0,
        retencaoMediaPrev: prev.retention || 0,
        watchTime: m.watch_time || 0,
        watchTimePrev: prev.watch_time || 0,
        inscricoesPorVideo: m.new_followers || 0,
        inscricoesPorVideoPrev: prev.new_followers || 0,
        visualizacoes: m.impressions || 0,
        visualizacoesPrev: prev.impressions || 0,
        inscritos: m.followers || 0,
      }
    }

    const sum = (arr: typeof current, key: keyof typeof current[0]) =>
      arr.reduce((s, m) => s + (m[key] as number), 0)
    const avg = (arr: typeof current, key: keyof typeof current[0]) =>
      arr.length > 0 ? sum(arr, key) / arr.length : 0

    return {
      ctrThumbnail: avg(current, 'ctrThumbnail'),
      ctrThumbnailPrev: avg(previous, 'ctrThumbnail'),
      retencaoMedia: avg(current, 'retencaoMedia'),
      retencaoMediaPrev: avg(previous, 'retencaoMedia'),
      watchTime: sum(current, 'watchTime'),
      watchTimePrev: sum(previous, 'watchTime'),
      inscricoesPorVideo: avg(current, 'inscricoesPorVideo'),
      inscricoesPorVideoPrev: avg(previous, 'inscricoesPorVideo'),
      visualizacoes: sum(current, 'visualizacoes'),
      visualizacoesPrev: sum(previous, 'visualizacoes'),
      inscritos: current.length > 0 ? current[current.length - 1].inscritos : 0,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, previous, platformData, isRealData])

  const compDays = daysBetween(ranges.comparacao.start, ranges.comparacao.end)

  const trend = platformData?.trend
  const emptyChart = [] as { label: string; value: number }[]
  const watchTimeData = useMemo(() => isRealData ? trendToChartData(trend?.watch_time, ranges.analise) : dailyData(current, totalDays, (m) => m.watchTime), [current, totalDays, isRealData, trend, ranges.analise])
  const watchTimeCompData = useMemo(() => isRealData ? emptyChart : dailyData(previous, compDays, (m) => m.watchTime), [previous, compDays, isRealData])
  const retencaoData = useMemo(() => isRealData ? trendToChartData(trend?.retention, ranges.analise) : dailyData(current, totalDays, (m) => m.retencaoMedia, 'avg'), [current, totalDays, isRealData, trend, ranges.analise])
  const retencaoCompData = useMemo(() => isRealData ? emptyChart : dailyData(previous, compDays, (m) => m.retencaoMedia, 'avg'), [previous, compDays, isRealData])
  const ctrData = useMemo(() => isRealData ? trendToChartData(trend?.ctr, ranges.analise) : dailyData(current, totalDays, (m) => m.ctrThumbnail, 'avg'), [current, totalDays, isRealData, trend, ranges.analise])
  const ctrCompData = useMemo(() => isRealData ? emptyChart : dailyData(previous, compDays, (m) => m.ctrThumbnail, 'avg'), [previous, compDays, isRealData])
  const inscricoesData = useMemo(() => isRealData ? trendToChartData(trend?.new_followers, ranges.analise) : dailyData(current, totalDays, (m) => m.inscricoesPorVideo, 'avg'), [current, totalDays, isRealData, trend, ranges.analise])
  const inscricoesCompData = useMemo(() => isRealData ? emptyChart : dailyData(previous, compDays, (m) => m.inscricoesPorVideo, 'avg'), [previous, compDays, isRealData])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
        <div>
          <h2 className="text-lg font-semibold">YouTube — Retenção e Profundidade</h2>
          <p className="text-xs text-muted-foreground">Foco: tempo e consumo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Watch Time"
          sublabel="Métrica mais importante"
          value={`${formatNumber(metrics.watchTime)}h`}
          change={calcChange(metrics.watchTime, metrics.watchTimePrev)}
          tooltip="Horas totais assistidas no período. YouTube Studio — é o fator #1 de recomendação do algoritmo."
          isKey
        />
        <MetricCard
          label="Retenção Média"
          sublabel="Qualidade do conteúdo"
          value={formatPercent(metrics.retencaoMedia)}
          change={calcChange(metrics.retencaoMedia, metrics.retencaoMediaPrev)}
          tooltip="% médio do vídeo assistido. YouTube Studio — acima de 50% indica conteúdo que prende a audiência."
          isKey
        />
        <MetricCard
          label="CTR Thumbnail"
          sublabel="Atrair clique"
          value={formatPercent(metrics.ctrThumbnail)}
          change={calcChange(metrics.ctrThumbnail, metrics.ctrThumbnailPrev)}
          tooltip="Taxa de cliques na thumbnail sobre impressões. YouTube Studio — acima de 5% é bom; mede o poder da capa."
          isKey
        />
        <MetricCard
          label="Inscrições/Vídeo"
          sublabel="Conversão"
          value={metrics.inscricoesPorVideo.toFixed(1)}
          change={calcChange(metrics.inscricoesPorVideo, metrics.inscricoesPorVideoPrev)}
          tooltip="Média de novos inscritos gerados por vídeo. YouTube Studio — mede o poder de conversão do conteúdo."
          isKey
        />
        <MetricCard
          label="Visualizações"
          sublabel="Não é o principal"
          value={formatNumber(metrics.visualizacoes)}
          change={calcChange(metrics.visualizacoes, metrics.visualizacoesPrev)}
          tooltip="Total de views no período. YouTube Studio — métrica de vaidade; o YouTube prioriza watch time sobre views."
        />
        <MetricCard
          label="Inscritos"
          value={formatNumber(metrics.inscritos)}
          tooltip="Total de inscritos do canal. YouTube Studio — crescimento geral da base de audiência."
        />
      </div>

      {realDataLoading ? (
        <RealDataLoading />
      ) : isRealData && !platformData ? (
        <RealDataEmpty platform="YouTube" error={realDataError} />
      ) : watchTimeData.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Watch Time Total (horas)" isMounted={isMounted}>
            <SimpleBarChart data={watchTimeData} comparisonData={watchTimeCompData} color={color} suffix="h" isMounted={isMounted} />
          </ChartCard>
          <ChartCard title="Retenção Média (%)" isMounted={isMounted}>
            <SimpleLineChart data={retencaoData} comparisonData={retencaoCompData} color={color} suffix="%" isMounted={isMounted} />
          </ChartCard>
          <ChartCard title="CTR de Thumbnail (%)" isMounted={isMounted}>
            <SimpleLineChart data={ctrData} comparisonData={ctrCompData} color={color} suffix="%" isMounted={isMounted} />
          </ChartCard>
          <ChartCard title="Inscrições por Vídeo" isMounted={isMounted}>
            <SimpleBarChart data={inscricoesData} comparisonData={inscricoesCompData} color={color} isMounted={isMounted} />
          </ChartCard>
        </div>
      ) : null}
    </div>
  )
}

// ===========================================================================
// COMPARATIVO SECTION
// ===========================================================================

function ComparativoAnalytics({ ranges, isMounted, allPlatformData }: { ranges: DateRanges; isMounted: boolean; allPlatformData?: PlatformData[] }) {
  const igData = useMemo(() => filterByDateRanges(mockInstagramMetrics, ranges), [ranges])
  const liData = useMemo(() => filterByDateRanges(mockLinkedInMetrics, ranges), [ranges])
  const ytData = useMemo(() => filterByDateRanges(mockYouTubeMetrics, ranges), [ranges])

  const igReal = allPlatformData?.find((p) => p.platform === 'Instagram')
  const liReal = allPlatformData?.find((p) => p.platform === 'LinkedIn')
  const ytReal = allPlatformData?.find((p) => p.platform === 'YouTube')
  const hasReal = !!allPlatformData && allPlatformData.length > 0

  // ---------- Instagram KPIs ----------
  const ig = useMemo(() => {
    if (hasReal && igReal) {
      const m = igReal.metrics
      const p = igReal.comparison.previous_period || {}
      return {
        alcance: m.reach || 0, alcancePrev: p.reach || 0,
        salvamentos: m.saves || 0, salvamentosPrev: p.saves || 0,
        compartilhamentos: m.shares || 0, compartilhamentosPrev: p.shares || 0,
        watchTime: m.watch_time || m.reels_watch_time || 0,
        watchTimePrev: p.watch_time || p.reels_watch_time || 0,
      }
    }
    const c = igData.current, pv = igData.previous
    const sum = (arr: typeof c, k: keyof typeof c[0]) => arr.reduce((s, m) => s + (m[k] as number), 0)
    return {
      alcance: sum(c, 'alcance'), alcancePrev: sum(pv, 'alcance'),
      salvamentos: sum(c, 'salvamentos'), salvamentosPrev: sum(pv, 'salvamentos'),
      compartilhamentos: sum(c, 'compartilhamentos'), compartilhamentosPrev: sum(pv, 'compartilhamentos'),
      watchTime: sum(c, 'watchTime'), watchTimePrev: sum(pv, 'watchTime'),
    }
  }, [igData, hasReal, igReal])

  // ---------- LinkedIn KPIs ----------
  const li = useMemo(() => {
    if (hasReal && liReal) {
      const m = liReal.metrics
      const p = liReal.comparison.previous_period || {}
      return {
        impressoes: m.impressions || 0, impressoesPrev: p.impressions || 0,
        comentarios: m.comments || 0, comentariosPrev: p.comments || 0,
        ctr: m.ctr || 0, ctrPrev: p.ctr || 0,
        segQual: m.new_followers || 0, segQualPrev: p.new_followers || 0,
      }
    }
    const c = liData.current, pv = liData.previous
    const sum = (arr: typeof c, k: keyof typeof c[0]) => arr.reduce((s, m) => s + (m[k] as number), 0)
    const avg = (arr: typeof c, k: keyof typeof c[0]) => arr.length > 0 ? sum(arr, k) / arr.length : 0
    return {
      impressoes: sum(c, 'impressoes'), impressoesPrev: sum(pv, 'impressoes'),
      comentarios: sum(c, 'comentarios'), comentariosPrev: sum(pv, 'comentarios'),
      ctr: avg(c, 'ctr'), ctrPrev: avg(pv, 'ctr'),
      segQual: sum(c, 'seguidoresQualificados'), segQualPrev: sum(pv, 'seguidoresQualificados'),
    }
  }, [liData, hasReal, liReal])

  // ---------- YouTube KPIs ----------
  const yt = useMemo(() => {
    if (hasReal && ytReal) {
      const m = ytReal.metrics
      const p = ytReal.comparison.previous_period || {}
      return {
        watchTime: m.watch_time || 0, watchTimePrev: p.watch_time || 0,
        retencao: m.retention || 0, retencaoPrev: p.retention || 0,
        ctrThumb: m.ctr || 0, ctrThumbPrev: p.ctr || 0,
        inscricoes: m.new_followers || 0, inscricoesPrev: p.new_followers || 0,
      }
    }
    const c = ytData.current, pv = ytData.previous
    const sum = (arr: typeof c, k: keyof typeof c[0]) => arr.reduce((s, m) => s + (m[k] as number), 0)
    const avg = (arr: typeof c, k: keyof typeof c[0]) => arr.length > 0 ? sum(arr, k) / arr.length : 0
    return {
      watchTime: sum(c, 'watchTime'), watchTimePrev: sum(pv, 'watchTime'),
      retencao: avg(c, 'retencaoMedia'), retencaoPrev: avg(pv, 'retencaoMedia'),
      ctrThumb: avg(c, 'ctrThumbnail'), ctrThumbPrev: avg(pv, 'ctrThumbnail'),
      inscricoes: avg(c, 'inscricoesPorVideo'), inscricoesPrev: avg(pv, 'inscricoesPorVideo'),
    }
  }, [ytData, hasReal, ytReal])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Comparativo — KPIs por Plataforma</h2>
        <p className="text-xs text-muted-foreground">
          Os 4 KPIs principais de cada rede, com período de análise vs comparação
        </p>
      </div>

      {/* Instagram */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS.instagram }} />
            <CardTitle className="text-sm" style={{ color: PLATFORM_COLORS.instagram }}>
              Instagram — Atenção e Distribuição
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI</TableHead>
                <TableHead className="text-right">Período Atual</TableHead>
                <TableHead className="text-right">Período Anterior</TableHead>
                <TableHead className="text-right">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {([
                { label: 'Alcance', cur: ig.alcance, prev: ig.alcancePrev, fmt: 'number' as const },
                { label: 'Salvamentos', cur: ig.salvamentos, prev: ig.salvamentosPrev, fmt: 'number' as const },
                { label: 'Compartilhamentos', cur: ig.compartilhamentos, prev: ig.compartilhamentosPrev, fmt: 'number' as const },
                { label: 'Watch Time', cur: ig.watchTime, prev: ig.watchTimePrev, fmt: 'hours' as const },
              ] as { label: string; cur: number; prev: number; fmt: 'number' | 'percent' | 'hours' }[]).map((row) => {
                const change = calcChange(row.cur, row.prev)
                const fmtVal = row.fmt === 'percent' ? formatPercent(row.cur) : row.fmt === 'hours' ? `${formatNumber(row.cur)}h` : formatNumber(row.cur)
                const fmtPrev = row.fmt === 'percent' ? formatPercent(row.prev) : row.fmt === 'hours' ? `${formatNumber(row.prev)}h` : formatNumber(row.prev)
                return (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-right font-semibold">{fmtVal}</TableCell>
                    <TableCell className="text-right text-zinc-500">{fmtPrev}</TableCell>
                    <TableCell className={`text-right font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatChange(change)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PlatformNotes platform="instagram" ranges={ranges} />

      {/* LinkedIn */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS.linkedin }} />
            <CardTitle className="text-sm" style={{ color: PLATFORM_COLORS.linkedin }}>
              LinkedIn — Autoridade e Conversão
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI</TableHead>
                <TableHead className="text-right">Período Atual</TableHead>
                <TableHead className="text-right">Período Anterior</TableHead>
                <TableHead className="text-right">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {([
                { label: 'Impressões', cur: li.impressoes, prev: li.impressoesPrev, fmt: 'number' as const },
                { label: 'Comentários', cur: li.comentarios, prev: li.comentariosPrev, fmt: 'number' as const },
                { label: 'CTR', cur: li.ctr, prev: li.ctrPrev, fmt: 'percent' as const },
                { label: 'Seguidores Qualificados', cur: li.segQual, prev: li.segQualPrev, fmt: 'number' as const },
              ] as { label: string; cur: number; prev: number; fmt: 'number' | 'percent' | 'hours' }[]).map((row) => {
                const change = calcChange(row.cur, row.prev)
                const fmtVal = row.fmt === 'percent' ? formatPercent(row.cur) : row.fmt === 'hours' ? `${formatNumber(row.cur)}h` : formatNumber(row.cur)
                const fmtPrev = row.fmt === 'percent' ? formatPercent(row.prev) : row.fmt === 'hours' ? `${formatNumber(row.prev)}h` : formatNumber(row.prev)
                return (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-right font-semibold">{fmtVal}</TableCell>
                    <TableCell className="text-right text-zinc-500">{fmtPrev}</TableCell>
                    <TableCell className={`text-right font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatChange(change)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PlatformNotes platform="linkedin" ranges={ranges} />

      {/* YouTube */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS.youtube }} />
            <CardTitle className="text-sm" style={{ color: PLATFORM_COLORS.youtube }}>
              YouTube — Retenção e Profundidade
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI</TableHead>
                <TableHead className="text-right">Período Atual</TableHead>
                <TableHead className="text-right">Período Anterior</TableHead>
                <TableHead className="text-right">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {([
                { label: 'Watch Time', cur: yt.watchTime, prev: yt.watchTimePrev, fmt: 'hours' as const },
                { label: 'Retenção Média', cur: yt.retencao, prev: yt.retencaoPrev, fmt: 'percent' as const },
                { label: 'CTR Thumbnail', cur: yt.ctrThumb, prev: yt.ctrThumbPrev, fmt: 'percent' as const },
                { label: 'Inscrições/Vídeo', cur: yt.inscricoes, prev: yt.inscricoesPrev, fmt: 'number' as const },
              ]).map((row) => {
                const change = calcChange(row.cur, row.prev)
                const fmtVal = row.fmt === 'percent' ? formatPercent(row.cur) : row.fmt === 'hours' ? `${formatNumber(row.cur)}h` : formatNumber(row.cur)
                const fmtPrev = row.fmt === 'percent' ? formatPercent(row.prev) : row.fmt === 'hours' ? `${formatNumber(row.prev)}h` : formatNumber(row.prev)
                return (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-right font-semibold">{fmtVal}</TableCell>
                    <TableCell className="text-right text-zinc-500">{fmtPrev}</TableCell>
                    <TableCell className={`text-right font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatChange(change)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PlatformNotes platform="youtube" ranges={ranges} />
    </div>
  )
}

// ===========================================================================
// REPORTEI LIVE DATA PANEL
// ===========================================================================

function ReporteiLivePanel({
  platformData,
  loading,
  error,
  onRefresh,
}: {
  platformData: PlatformData[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}) {
  if (error) {
    return (
      <Card className="border-red-900/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-400">Erro ao carregar dados: {error}</p>
            <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <div className="size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando dados do Reportei...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (platformData.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Live Data Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-emerald-400">Dados Reais — Reportei</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs">
          Atualizar
        </Button>
      </div>

      {/* Platform Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {platformData.map((p) => {
          const platformKey = p.platform.toLowerCase() as keyof typeof PLATFORM_COLORS
          const color = PLATFORM_COLORS[platformKey] || '#888'
          return (
            <Card key={p.integrationId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span style={{ color }}>{p.platform}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {p.slug}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Impressões</p>
                    <p className="text-lg font-bold">{formatNumber(p.metrics.impressions)}</p>
                    {p.comparison.variation_percent['impressions'] !== undefined && (
                      <p className={`text-xs ${p.comparison.variation_percent['impressions'] >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatChange(p.comparison.variation_percent['impressions'])}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Alcance</p>
                    <p className="text-lg font-bold">{formatNumber(p.metrics.reach)}</p>
                    {p.comparison.variation_percent['reach'] !== undefined && (
                      <p className={`text-xs ${p.comparison.variation_percent['reach'] >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatChange(p.comparison.variation_percent['reach'])}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Engajamento</p>
                    <p className="text-lg font-bold">{formatNumber(p.metrics.engagement)}</p>
                    {p.comparison.variation_percent['engagement'] !== undefined && (
                      <p className={`text-xs ${p.comparison.variation_percent['engagement'] >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatChange(p.comparison.variation_percent['engagement'])}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Seguidores</p>
                    <p className="text-lg font-bold">{formatNumber(p.metrics.followers)}</p>
                    {p.metrics.growth_rate !== 0 && (
                      <p className={`text-xs ${p.metrics.growth_rate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatChange(p.metrics.growth_rate)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}

// ===========================================================================
// PLATFORM NOTES (inline per platform in Comparativo)
// ===========================================================================

interface PlatformNote {
  id: string
  plataforma: Platform
  criadoEm: string
  periodoAnalise: DateRange
  periodoComparacao: DateRange
  certo: string
  errado: string
  insight: string
  proximaAcao: string
}

function formatRangeBR(range: DateRange): string {
  const fmt = (d: string) => {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }
  return `${fmt(range.start)} – ${fmt(range.end)}`
}

function PlatformNotes({ platform, ranges }: { platform: Platform; ranges: DateRanges }) {
  const [notes, setNotes] = useLocalStorage<PlatformNote[]>(
    `content-dashboard:notes-${platform}`,
    []
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const color = PLATFORM_COLORS[platform]

  // Clean up any duplicates on mount
  useEffect(() => {
    const seen = new Set<string>()
    const deduped = notes.filter((n) => {
      if (seen.has(n.id)) return false
      seen.add(n.id)
      return true
    })
    if (deduped.length !== notes.length) {
      setNotes(deduped)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createNote = useCallback(() => {
    const id = crypto.randomUUID()
    const newNote: PlatformNote = {
      id,
      plataforma: platform,
      criadoEm: new Date().toISOString(),
      periodoAnalise: { ...ranges.analise },
      periodoComparacao: { ...ranges.comparacao },
      certo: '',
      errado: '',
      insight: '',
      proximaAcao: '',
    }
    // Use deduplication to prevent StrictMode double-invoke
    setNotes((prev) => {
      if (prev.some((n) => n.id === id)) return prev
      return [...prev, newNote]
    })
    setExpandedId(id)
    setEditingId(id)
  }, [platform, ranges, setNotes])

  const updateNote = useCallback(
    (id: string, field: keyof Pick<PlatformNote, 'certo' | 'errado' | 'insight' | 'proximaAcao'>, value: string) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, [field]: value } : n))
      )
    },
    [setNotes]
  )

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== id))
      if (expandedId === id) setExpandedId(null)
      if (editingId === id) setEditingId(null)
    },
    [setNotes, expandedId, editingId]
  )

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
    setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileTextIcon className="size-3.5" style={{ color }} />
          <span className="text-sm font-medium" style={{ color }}>
            Notas de Análise
          </span>
          {notes.length > 0 && (
            <span className="text-xs text-muted-foreground">({notes.length})</span>
          )}
        </div>
        <Button onClick={createNote} variant="outline" size="sm" className="gap-1.5 text-xs" style={{ borderColor: `${color}44`, color }}>
          <PlusIcon className="size-3" />
          Nova Nota
        </Button>
      </div>

      {notes.length === 0 && (
        <div
          className="rounded-lg border border-dashed px-4 py-3 text-center text-xs text-muted-foreground"
          style={{ borderColor: `${color}33` }}
        >
          Nenhuma nota para {PLATFORM_LABELS[platform]}. Clique em &quot;Nova Nota&quot; para registrar sua análise.
        </div>
      )}

      {notes.map((note) => {
        const isExpanded = expandedId === note.id
        const isEditing = editingId === note.id
        const createdDate = new Date(note.criadoEm).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        const hasContent = note.certo || note.errado || note.insight || note.proximaAcao

        return (
          <Card key={note.id} className={isExpanded ? 'ring-1' : ''} style={isExpanded ? { borderColor: `${color}55` } : {}}>
            <button
              onClick={() => toggleExpand(note.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {formatRangeBR(note.periodoAnalise)} vs {formatRangeBR(note.periodoComparacao)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {createdDate}
                  {!hasContent && ' — vazia'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasContent && (
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
                )}
                {isExpanded ? (
                  <ChevronUpIcon className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]" />
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {([
                      { key: 'certo' as const, label: 'O que deu certo', labelColor: 'text-emerald-400' },
                      { key: 'errado' as const, label: 'O que deu errado', labelColor: 'text-red-400' },
                      { key: 'insight' as const, label: 'Insight', labelColor: 'text-amber-400' },
                      { key: 'proximaAcao' as const, label: 'Próxima ação', labelColor: 'text-blue-400' },
                    ]).map(({ key, label, labelColor }) => (
                      <TableRow key={key}>
                        <TableCell className={`font-medium ${labelColor} align-top`}>
                          {label}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <textarea
                              value={note[key]}
                              onChange={(e) => updateNote(note.id, key, e.target.value)}
                              placeholder="Escreva aqui..."
                              rows={2}
                              className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-foreground placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                            />
                          ) : (
                            <p className="whitespace-pre-wrap text-sm text-zinc-300">
                              {note[key] || <span className="text-zinc-600 italic">—</span>}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-red-400 border-red-900/50 hover:bg-red-950/30"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2Icon className="size-3 mr-1" />
                    Excluir
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => setEditingId(isEditing ? null : note.id)}
                  >
                    {isEditing ? 'Salvar' : 'Editar'}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// ===========================================================================
// MAIN PAGE
// ===========================================================================

export default function AnalyticsPage() {
  const [ranges, setRanges] = useState<DateRanges>(() => buildRanges(new Date()))
  const [activeTab, setActiveTab] = useState<ActiveTab>('instagram')
  const [isMounted, setIsMounted] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { projectId, isConfigured } = useReporteiConfig()

  const [dataSource, setDataSource] = useState<'mock' | 'reportei'>('mock')

  // Switch to reportei once config loads from localStorage
  useEffect(() => {
    if (isConfigured) setDataSource('reportei')
  }, [isConfigured])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isReportei = isConfigured && dataSource === 'reportei'

  const {
    result: reporteiData,
    loading: reporteiLoading,
    error: reporteiError,
    refetch: refetchReportei,
  } = usePlatformData(
    isReportei ? projectId : null,
    ranges.analise.start,
    ranges.analise.end,
    ranges.comparacao.start,
    ranges.comparacao.end,
    isReportei
  )

  // Extract per-platform data from Reportei response
  const reporteiPlatforms = reporteiData?.data || []
  const igPlatformData = isReportei ? reporteiPlatforms.find((p) => p.platform === 'Instagram') : undefined
  const liPlatformData = isReportei ? reporteiPlatforms.find((p) => p.platform === 'LinkedIn') : undefined
  const ytPlatformData = isReportei ? reporteiPlatforms.find((p) => p.platform === 'YouTube') : undefined

  // Debug: log para verificar dados recebidos
  useEffect(() => {
    if (isReportei && reporteiData) {
      console.log('[Analytics] Reportei platforms:', reporteiPlatforms.map((p) => p.platform))
      console.log('[Analytics] IG data:', igPlatformData ? Object.keys(igPlatformData.metrics).filter((k) => igPlatformData.metrics[k] > 0) : 'not found')
      console.log('[Analytics] LI data:', liPlatformData ? Object.keys(liPlatformData.metrics).filter((k) => liPlatformData.metrics[k] > 0) : 'not found')
      console.log('[Analytics] YT data:', ytPlatformData ? Object.keys(ytPlatformData.metrics).filter((k) => ytPlatformData.metrics[k] > 0) : 'not found')
    }
  }, [isReportei, reporteiData, reporteiPlatforms, igPlatformData, liPlatformData, ytPlatformData])

  // =========================================================================
  // PDF METRICS (calculated centrally for export)
  // =========================================================================

  const igMockFiltered = useMemo(() => filterByDateRanges(mockInstagramMetrics, ranges), [ranges])
  const liMockFiltered = useMemo(() => filterByDateRanges(mockLinkedInMetrics, ranges), [ranges])
  const ytMockFiltered = useMemo(() => filterByDateRanges(mockYouTubeMetrics, ranges), [ranges])

  const pdfInstagram = useMemo(() => {
    if (isReportei && igPlatformData) {
      const m = igPlatformData.metrics, p = igPlatformData.comparison.previous_period || {}
      return {
        alcance: m.reach || 0, alcancePrev: p.reach || 0,
        salvamentos: m.saves || 0, salvamentosPrev: p.saves || 0,
        compartilhamentos: m.shares || 0, compartilhamentosPrev: p.shares || 0,
        watchTime: m.watch_time || m.reels_watch_time || 0, watchTimePrev: p.watch_time || p.reels_watch_time || 0,
        cliquesLink: m.clicks || 0, cliquesLinkPrev: p.clicks || 0,
        interacoesDirect: m.direct_interactions || m.story_replies || 0, interacoesDirectPrev: p.direct_interactions || p.story_replies || 0,
        seguidores: m.followers || 0,
      }
    }
    const c = igMockFiltered.current, pv = igMockFiltered.previous
    const sum = (arr: typeof c, k: keyof typeof c[0]) => arr.reduce((s, m) => s + (m[k] as number), 0)
    const avg = (arr: typeof c, k: keyof typeof c[0]) => arr.length > 0 ? sum(arr, k) / arr.length : 0
    return {
      alcance: sum(c, 'alcance'), alcancePrev: sum(pv, 'alcance'),
      salvamentos: sum(c, 'salvamentos'), salvamentosPrev: sum(pv, 'salvamentos'),
      compartilhamentos: sum(c, 'compartilhamentos'), compartilhamentosPrev: sum(pv, 'compartilhamentos'),
      watchTime: sum(c, 'watchTime'), watchTimePrev: sum(pv, 'watchTime'),
      cliquesLink: sum(c, 'cliquesLink'), cliquesLinkPrev: sum(pv, 'cliquesLink'),
      interacoesDirect: sum(c, 'interacoesDirect'), interacoesDirectPrev: sum(pv, 'interacoesDirect'),
      seguidores: c.length > 0 ? c[c.length - 1].seguidores : 0,
    }
  }, [igMockFiltered, isReportei, igPlatformData])

  const pdfLinkedin = useMemo(() => {
    if (isReportei && liPlatformData) {
      const m = liPlatformData.metrics, p = liPlatformData.comparison.previous_period || {}
      return {
        impressoes: m.impressions || 0, impressoesPrev: p.impressions || 0,
        comentarios: m.comments || 0, comentariosPrev: p.comments || 0,
        reacoes: m.reactions || 0, reacoesPrev: p.reactions || 0,
        ctr: m.ctr || 0, ctrPrev: p.ctr || 0,
        seguidoresQualificados: m.new_followers || 0, seguidoresQualificadosPrev: p.new_followers || 0,
        compartilhamentos: m.shares || 0, compartilhamentosPrev: p.shares || 0,
        seguidores: m.followers || 0,
      }
    }
    const c = liMockFiltered.current, pv = liMockFiltered.previous
    const sum = (arr: typeof c, k: keyof typeof c[0]) => arr.reduce((s, m) => s + (m[k] as number), 0)
    const avg = (arr: typeof c, k: keyof typeof c[0]) => arr.length > 0 ? sum(arr, k) / arr.length : 0
    return {
      impressoes: sum(c, 'impressoes'), impressoesPrev: sum(pv, 'impressoes'),
      comentarios: sum(c, 'comentarios'), comentariosPrev: sum(pv, 'comentarios'),
      reacoes: sum(c, 'reacoes'), reacoesPrev: sum(pv, 'reacoes'),
      ctr: avg(c, 'ctr'), ctrPrev: avg(pv, 'ctr'),
      seguidoresQualificados: sum(c, 'seguidoresQualificados'), seguidoresQualificadosPrev: sum(pv, 'seguidoresQualificados'),
      compartilhamentos: sum(c, 'compartilhamentos'), compartilhamentosPrev: sum(pv, 'compartilhamentos'),
      seguidores: c.length > 0 ? c[c.length - 1].seguidores : 0,
    }
  }, [liMockFiltered, isReportei, liPlatformData])

  const pdfYoutube = useMemo(() => {
    if (isReportei && ytPlatformData) {
      const m = ytPlatformData.metrics, p = ytPlatformData.comparison.previous_period || {}
      return {
        ctrThumbnail: m.ctr || 0, ctrThumbnailPrev: p.ctr || 0,
        retencaoMedia: m.retention || 0, retencaoMediaPrev: p.retention || 0,
        watchTime: m.watch_time || 0, watchTimePrev: p.watch_time || 0,
        inscricoesPorVideo: m.new_followers || 0, inscricoesPorVideoPrev: p.new_followers || 0,
        visualizacoes: m.impressions || 0, visualizacoesPrev: p.impressions || 0,
        inscritos: m.followers || 0,
      }
    }
    const c = ytMockFiltered.current, pv = ytMockFiltered.previous
    const sum = (arr: typeof c, k: keyof typeof c[0]) => arr.reduce((s, m) => s + (m[k] as number), 0)
    const avg = (arr: typeof c, k: keyof typeof c[0]) => arr.length > 0 ? sum(arr, k) / arr.length : 0
    return {
      ctrThumbnail: avg(c, 'ctrThumbnail'), ctrThumbnailPrev: avg(pv, 'ctrThumbnail'),
      retencaoMedia: avg(c, 'retencaoMedia'), retencaoMediaPrev: avg(pv, 'retencaoMedia'),
      watchTime: sum(c, 'watchTime'), watchTimePrev: sum(pv, 'watchTime'),
      inscricoesPorVideo: avg(c, 'inscricoesPorVideo'), inscricoesPorVideoPrev: avg(pv, 'inscricoesPorVideo'),
      visualizacoes: sum(c, 'visualizacoes'), visualizacoesPrev: sum(pv, 'visualizacoes'),
      inscritos: c.length > 0 ? c[c.length - 1].inscritos : 0,
    }
  }, [ytMockFiltered, isReportei, ytPlatformData])

  const pdfComparativo = useMemo(() => ({
    ig: {
      alcance: pdfInstagram.alcance, alcancePrev: pdfInstagram.alcancePrev,
      salvamentos: pdfInstagram.salvamentos, salvamentosPrev: pdfInstagram.salvamentosPrev,
      compartilhamentos: pdfInstagram.compartilhamentos, compartilhamentosPrev: pdfInstagram.compartilhamentosPrev,
      watchTime: pdfInstagram.watchTime, watchTimePrev: pdfInstagram.watchTimePrev,
    },
    li: {
      impressoes: pdfLinkedin.impressoes, impressoesPrev: pdfLinkedin.impressoesPrev,
      comentarios: pdfLinkedin.comentarios, comentariosPrev: pdfLinkedin.comentariosPrev,
      ctr: pdfLinkedin.ctr, ctrPrev: pdfLinkedin.ctrPrev,
      segQual: pdfLinkedin.seguidoresQualificados, segQualPrev: pdfLinkedin.seguidoresQualificadosPrev,
    },
    yt: {
      watchTime: pdfYoutube.watchTime, watchTimePrev: pdfYoutube.watchTimePrev,
      retencao: pdfYoutube.retencaoMedia, retencaoPrev: pdfYoutube.retencaoMediaPrev,
      ctrThumb: pdfYoutube.ctrThumbnail, ctrThumbPrev: pdfYoutube.ctrThumbnailPrev,
      inscricoes: pdfYoutube.inscricoesPorVideo, inscricoesPrev: pdfYoutube.inscricoesPorVideoPrev,
    },
  }), [pdfInstagram, pdfLinkedin, pdfYoutube])

  // Chart data for PDF (calculated from mock data)
  const igTrend = igPlatformData?.trend
  const liTrend = liPlatformData?.trend
  const ytTrend = ytPlatformData?.trend
  const totalDaysPdf = daysBetween(ranges.analise.start, ranges.analise.end)

  const pdfChartData = useMemo(() => {
    const igCurrent = igMockFiltered.current
    const liCurrent = liMockFiltered.current
    const ytCurrent = ytMockFiltered.current

    const IG: [number, number, number] = [225, 48, 108]
    const LI: [number, number, number] = [10, 102, 194]
    const YT: [number, number, number] = [255, 0, 0]

    return {
      instagram: [
        { title: 'Alcance (Distribuição)', data: isReportei ? trendToChartData(igTrend?.reach, ranges.analise) : dailyData(igCurrent, totalDaysPdf, (m) => m.alcance), color: IG, type: 'line' as const },
        { title: 'Salvamentos (Qualidade)', data: isReportei ? trendToChartData(igTrend?.saves, ranges.analise) : dailyData(igCurrent, totalDaysPdf, (m) => m.salvamentos), color: IG, type: 'bar' as const },
        { title: 'Watch Time (horas)', data: isReportei ? trendToChartData(igTrend?.watch_time || igTrend?.reels_watch_time, ranges.analise) : dailyData(igCurrent, totalDaysPdf, (m) => m.watchTime), color: IG, type: 'bar' as const, suffix: 'h' },
        { title: 'Cliques no Link (Intenção)', data: isReportei ? trendToChartData(igTrend?.clicks, ranges.analise) : dailyData(igCurrent, totalDaysPdf, (m) => m.cliquesLink), color: IG, type: 'bar' as const },
      ],
      linkedin: [
        { title: 'Impressões (Distribuição)', data: isReportei ? trendToChartData(liTrend?.impressions, ranges.analise) : dailyData(liCurrent, totalDaysPdf, (m) => m.impressoes), color: LI, type: 'line' as const },
        { title: 'Comentários (Profundidade)', data: isReportei ? trendToChartData(liTrend?.comments, ranges.analise) : dailyData(liCurrent, totalDaysPdf, (m) => m.comentarios), color: LI, type: 'bar' as const },
        { title: 'CTR (%)', data: isReportei ? trendToChartData(liTrend?.ctr, ranges.analise) : dailyData(liCurrent, totalDaysPdf, (m) => m.ctr, 'avg'), color: LI, type: 'line' as const, suffix: '%' },
        { title: 'Seguidores Qualificados', data: isReportei ? trendToChartData(liTrend?.new_followers, ranges.analise) : dailyData(liCurrent, totalDaysPdf, (m) => m.seguidoresQualificados), color: LI, type: 'bar' as const },
      ],
      youtube: [
        { title: 'Watch Time (horas)', data: isReportei ? trendToChartData(ytTrend?.watch_time, ranges.analise) : dailyData(ytCurrent, totalDaysPdf, (m) => m.watchTime), color: YT, type: 'bar' as const, suffix: 'h' },
        { title: 'Retenção Média (%)', data: isReportei ? trendToChartData(ytTrend?.retention, ranges.analise) : dailyData(ytCurrent, totalDaysPdf, (m) => m.retencaoMedia, 'avg'), color: YT, type: 'line' as const, suffix: '%' },
        { title: 'CTR Thumbnail (%)', data: isReportei ? trendToChartData(ytTrend?.ctr, ranges.analise) : dailyData(ytCurrent, totalDaysPdf, (m) => m.ctrThumbnail, 'avg'), color: YT, type: 'line' as const, suffix: '%' },
        { title: 'Inscrições por Vídeo', data: isReportei ? trendToChartData(ytTrend?.new_followers, ranges.analise) : dailyData(ytCurrent, totalDaysPdf, (m) => m.inscricoesPorVideo, 'avg'), color: YT, type: 'bar' as const },
      ],
    }
  }, [igMockFiltered, liMockFiltered, ytMockFiltered, isReportei, igTrend, liTrend, ytTrend, ranges, totalDaysPdf])

  const handleExportPDF = useCallback(async () => {
    setExporting(true)

    // Read notes directly from localStorage at export time (separate keys per platform)
    const notesForPdf: PlatformNote[] = []
    for (const p of ['instagram', 'linkedin', 'youtube'] as Platform[]) {
      try {
        const raw = localStorage.getItem(`content-dashboard:notes-${p}`)
        if (raw) {
          const parsed: PlatformNote[] = JSON.parse(raw)
          notesForPdf.push(...parsed)
        }
      } catch { /* empty */ }
    }

    try {
      const { exportAnalyticsPDF } = await import('@/lib/pdf-export')
      await exportAnalyticsPDF({
        ranges,
        instagram: pdfInstagram,
        linkedin: pdfLinkedin,
        youtube: pdfYoutube,
        comparativo: pdfComparativo,
        notes: notesForPdf,
        chartData: pdfChartData,
      })
    } catch (err) {
      console.error('PDF export error:', err)
    } finally {
      setExporting(false)
    }
  }, [ranges, pdfInstagram, pdfLinkedin, pdfYoutube, pdfComparativo, pdfChartData])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Métricas estratégicas por plataforma — cada rede tem suas métricas ideais
          </p>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={exporting}
          className="gap-2"
          variant="outline"
        >
          {exporting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <DownloadIcon className="size-4" />
          )}
          {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>

      {/* Reportei Config + Data Source Toggle */}
      <ReporteiConfig dataSource={dataSource} onDataSourceChange={setDataSource} />

      {/* Date Range Selector */}
      <DateRangeSelector ranges={ranges} onChange={setRanges} />

      {/* Platform Tabs */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-full sm:w-fit overflow-x-auto">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={[
                'rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-none justify-center',
                activeTab === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {tab.color && (
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: activeTab === tab.value ? tab.color : 'currentColor' }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>
        {dataSource === 'mock' ? (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            Dados de demonstração
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
            Dados reais — Reportei
          </Badge>
        )}
      </div>

      {/* Detailed Analytics Content */}
      {activeTab === 'instagram' && <InstagramAnalytics ranges={ranges} isMounted={isMounted} platformData={igPlatformData} isRealData={isReportei} realDataLoading={reporteiLoading} realDataError={reporteiError} />}
      {activeTab === 'linkedin' && <LinkedInAnalytics ranges={ranges} isMounted={isMounted} platformData={liPlatformData} isRealData={isReportei} realDataLoading={reporteiLoading} realDataError={reporteiError} />}
      {activeTab === 'youtube' && <YouTubeAnalytics ranges={ranges} isMounted={isMounted} platformData={ytPlatformData} isRealData={isReportei} realDataLoading={reporteiLoading} realDataError={reporteiError} />}
      {activeTab === 'comparativo' && <ComparativoAnalytics ranges={ranges} isMounted={isMounted} allPlatformData={isReportei ? reporteiPlatforms : undefined} />}

    </div>
  )
}
