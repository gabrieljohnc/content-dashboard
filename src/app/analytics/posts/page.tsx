'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PLATFORM_COLORS, POST_TYPE_LABELS } from '@/lib/constants'
import { mockTopPostsInstagram, mockTopPostsLinkedIn, mockTopPostsYouTube } from '@/lib/mock-data'
import type { TopPostInstagram, TopPostLinkedIn, TopPostYouTube } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts'
import { TrendingUpIcon, CalendarIcon, EyeIcon, BookmarkIcon, ShareIcon, MessageCircleIcon, ClockIcon, MousePointerClickIcon, ThumbsUpIcon, TargetIcon, GitCompareArrowsIcon, XIcon, CheckIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('pt-BR')
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Shared KPI Card
// ---------------------------------------------------------------------------

function KpiCard({ label, value, suffix, icon: Icon, color }: { label: string; value: string; suffix?: string; icon?: React.ElementType; color: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}<span className="text-sm font-normal text-zinc-500">{suffix}</span></p>
        </div>
        {Icon && (
          <div className="rounded-lg p-2" style={{ backgroundColor: `${color}15` }}>
            <Icon className="size-4" style={{ color }} />
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 h-[2px] w-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Post Card (list item)
// ---------------------------------------------------------------------------

function formatShortDate(dateStr: string): { day: string; month: string } {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit' })
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return { day, month }
}

function sortByDateDesc<T extends { dataPublicacao: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime())
}

function PostListCard({ date, title, subtitle, mainMetric, mainLabel, secondaryMetrics, color, onClick }: {
  date: string
  title: string
  subtitle: string
  mainMetric: string
  mainLabel: string
  secondaryMetrics: { label: string; value: string }[]
  color: string
  onClick: () => void
}) {
  const { day, month } = formatShortDate(date)
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start gap-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/80 hover:shadow-lg"
    >
      {/* Date badge */}
      <div
        className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}12` }}
      >
        <span className="text-base font-bold leading-none" style={{ color }}>{day}</span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-400">{month}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-white transition-colors">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>

        {/* Metrics row */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {secondaryMetrics.map((m) => (
            <div key={m.label} className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500">{m.label}</span>
              <span className="text-xs font-semibold">{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main metric */}
      <div className="shrink-0 text-right">
        <p className="text-xl font-bold" style={{ color }}>{mainMetric}</p>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{mainLabel}</p>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Chart Wrapper
// ---------------------------------------------------------------------------

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
      <div className="h-[280px]">
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Instagram Detail
// ---------------------------------------------------------------------------

function InstagramDetail({ post }: { post: TopPostInstagram }) {
  const color = PLATFORM_COLORS.instagram
  const metrics = [
    { label: 'Alcance', value: formatNumber(post.alcance), icon: EyeIcon },
    { label: 'Salvamentos', value: formatNumber(post.salvamentos), icon: BookmarkIcon },
    { label: 'Compartilhamentos', value: formatNumber(post.compartilhamentos), icon: ShareIcon },
    { label: 'Interações Direct', value: formatNumber(post.interacoesDirect), icon: MessageCircleIcon },
    { label: 'Comentários', value: formatNumber(post.comentarios), icon: MessageCircleIcon },
    ...(post.watchTime ? [{ label: 'Watch Time', value: `${post.watchTime}`, suffix: 'h', icon: ClockIcon }] : []),
  ]
  const barData = [
    { name: 'Alcance', value: post.alcance },
    { name: 'Salvamentos', value: post.salvamentos },
    { name: 'Compart.', value: post.compartilhamentos },
    { name: 'Direct', value: post.interacoesDirect },
    { name: 'Comentários', value: post.comentarios },
  ]
  const radarData = [
    { metric: 'Alcance', value: post.alcance, max: 100000 },
    { metric: 'Salvamentos', value: post.salvamentos, max: 1500 },
    { metric: 'Compart.', value: post.compartilhamentos, max: 2000 },
    { metric: 'Direct', value: post.interacoesDirect, max: 200 },
    { metric: 'Comentários', value: post.comentarios, max: 600 },
  ].map((d) => ({ ...d, normalized: Math.round((d.value / d.max) * 100) }))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: `${color}20`, color }}>{POST_TYPE_LABELS[post.tipo]}</span>
        <span className="flex items-center gap-1 text-xs text-zinc-500"><CalendarIcon className="size-3" />{formatDate(post.dataPublicacao)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((m) => <KpiCard key={m.label} label={m.label} value={m.value} suffix={'suffix' in m ? (m as { suffix: string }).suffix : ''} icon={m.icon} color={color} />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSection title="Distribuição de Métricas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#52525b', fontSize: 10 }} tickFormatter={formatNumber} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: 10, fontSize: 12 }} formatter={(v) => [formatNumber(Number(v)), '']} />
              <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
        <ChartSection title="Performance Relativa">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
              <PolarGrid stroke="#27272a" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar dataKey="normalized" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// LinkedIn Detail
// ---------------------------------------------------------------------------

function LinkedInDetail({ post }: { post: TopPostLinkedIn }) {
  const color = PLATFORM_COLORS.linkedin
  const metrics = [
    { label: 'Impressões', value: formatNumber(post.impressoes), icon: EyeIcon },
    { label: 'Comentários', value: formatNumber(post.comentarios), icon: MessageCircleIcon },
    { label: 'Salvamentos', value: formatNumber(post.salvamentos), icon: BookmarkIcon },
    { label: 'Dwell Time', value: `${post.dwellTime.toFixed(1)}`, suffix: 's', icon: ClockIcon },
    { label: 'Compartilhamentos', value: formatNumber(post.compartilhamentos), icon: ShareIcon },
  ]
  const barData = [
    { name: 'Impressões', value: post.impressoes },
    { name: 'Comentários', value: post.comentarios },
    { name: 'Salvamentos', value: post.salvamentos },
    { name: 'Compart.', value: post.compartilhamentos },
  ]
  const radarData = [
    { metric: 'Impressões', value: post.impressoes, max: 130000 },
    { metric: 'Comentários', value: post.comentarios, max: 700 },
    { metric: 'Salvamentos', value: post.salvamentos, max: 2500 },
    { metric: 'Dwell Time', value: post.dwellTime, max: 70 },
    { metric: 'Compart.', value: post.compartilhamentos, max: 1500 },
  ].map((d) => ({ ...d, normalized: Math.round((d.value / d.max) * 100) }))

  return (
    <div className="flex flex-col gap-5">
      <span className="flex items-center gap-1 text-xs text-zinc-500"><CalendarIcon className="size-3" />{formatDate(post.dataPublicacao)}</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((m) => <KpiCard key={m.label} label={m.label} value={m.value} suffix={'suffix' in m ? (m as { suffix: string }).suffix : ''} icon={m.icon} color={color} />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSection title="Distribuição de Métricas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#52525b', fontSize: 10 }} tickFormatter={formatNumber} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: 10, fontSize: 12 }} formatter={(v) => [formatNumber(Number(v)), '']} />
              <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
        <ChartSection title="Performance Relativa">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
              <PolarGrid stroke="#27272a" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar dataKey="normalized" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// YouTube Detail
// ---------------------------------------------------------------------------

function YouTubeDetail({ post }: { post: TopPostYouTube }) {
  const color = PLATFORM_COLORS.youtube
  const metrics = [
    { label: 'Visualizações', value: formatNumber(post.visualizacoes), icon: EyeIcon },
    { label: 'CTR Thumbnail', value: `${post.ctrThumbnail}`, suffix: '%', icon: MousePointerClickIcon },
    { label: 'Retenção Média', value: `${post.retencaoMedia}`, suffix: '%', icon: TargetIcon },
    { label: 'Watch Time', value: formatNumber(post.watchTime), suffix: 'h', icon: ClockIcon },
    { label: 'Engajamento', value: `${post.engajamento}`, suffix: '%', icon: TrendingUpIcon },
    { label: 'Curtidas', value: formatNumber(post.curtidas), icon: ThumbsUpIcon },
    { label: 'Comentários', value: formatNumber(post.comentarios), icon: MessageCircleIcon },
  ]
  const barData = [
    { name: 'Views', value: post.visualizacoes },
    { name: 'Curtidas', value: post.curtidas },
    { name: 'Comentários', value: post.comentarios },
    { name: 'Watch Time', value: post.watchTime },
  ]
  const radarData = [
    { metric: 'Views', value: post.visualizacoes, max: 80000 },
    { metric: 'CTR', value: post.ctrThumbnail, max: 12 },
    { metric: 'Retenção', value: post.retencaoMedia, max: 80 },
    { metric: 'Engajam.', value: post.engajamento, max: 8 },
    { metric: 'Curtidas', value: post.curtidas, max: 3000 },
    { metric: 'Coment.', value: post.comentarios, max: 500 },
  ].map((d) => ({ ...d, normalized: Math.round((d.value / d.max) * 100) }))

  return (
    <div className="flex flex-col gap-5">
      <span className="flex items-center gap-1 text-xs text-zinc-500"><CalendarIcon className="size-3" />{formatDate(post.dataPublicacao)}</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m) => <KpiCard key={m.label} label={m.label} value={m.value} suffix={'suffix' in m ? (m as { suffix: string }).suffix : ''} icon={m.icon} color={color} />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSection title="Distribuição de Métricas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#52525b', fontSize: 10 }} tickFormatter={formatNumber} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: 10, fontSize: 12 }} formatter={(v) => [formatNumber(Number(v)), '']} />
              <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
        <ChartSection title="Performance Relativa">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
              <PolarGrid stroke="#27272a" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar dataKey="normalized" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compare helpers
// ---------------------------------------------------------------------------

function DeltaBadge({ a, b, suffix = '', invert = false }: { a: number; b: number; suffix?: string; invert?: boolean }) {
  if (a === 0 && b === 0) return <span className="text-[11px] text-zinc-600">—</span>
  const diff = a - b
  const pct = b !== 0 ? ((diff / b) * 100) : 0
  const positive = invert ? diff < 0 : diff > 0
  const color = diff === 0 ? 'text-zinc-500' : positive ? 'text-emerald-400' : 'text-red-400'
  const sign = diff > 0 ? '+' : ''
  return <span className={`text-[11px] font-medium ${color}`}>{sign}{pct.toFixed(1)}%</span>
}

function CompareRow({ label, valA, valB, rawA, rawB, suffix, invert }: {
  label: string; valA: string; valB: string; rawA: number; rawB: number; suffix?: string; invert?: boolean
}) {
  return (
    <div className="grid grid-cols-[1fr_80px_40px_80px] items-center gap-2 py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className="text-sm font-semibold text-right">{valA}</span>
      <DeltaBadge a={rawA} b={rawB} suffix={suffix} invert={invert} />
      <span className="text-sm font-semibold text-right">{valB}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Instagram Comparison
// ---------------------------------------------------------------------------

function InstagramCompare({ a, b }: { a: TopPostInstagram; b: TopPostInstagram }) {
  const color = PLATFORM_COLORS.instagram
  const rows = [
    { label: 'Alcance', a: a.alcance, b: b.alcance },
    { label: 'Salvamentos', a: a.salvamentos, b: b.salvamentos },
    { label: 'Compartilhamentos', a: a.compartilhamentos, b: b.compartilhamentos },
    { label: 'Interações Direct', a: a.interacoesDirect, b: b.interacoesDirect },
    { label: 'Comentários', a: a.comentarios, b: b.comentarios },
    ...(a.watchTime || b.watchTime ? [{ label: 'Watch Time (h)', a: a.watchTime ?? 0, b: b.watchTime ?? 0 }] : []),
  ]
  const radarMax: Record<string, number> = { 'Alcance': 100000, 'Salvamentos': 1500, 'Compart.': 2000, 'Direct': 200, 'Comentários': 600 }
  const radarData = [
    { metric: 'Alcance', A: a.alcance, B: b.alcance, max: radarMax['Alcance'] },
    { metric: 'Salvamentos', A: a.salvamentos, B: b.salvamentos, max: radarMax['Salvamentos'] },
    { metric: 'Compart.', A: a.compartilhamentos, B: b.compartilhamentos, max: radarMax['Compart.'] },
    { metric: 'Direct', A: a.interacoesDirect, B: b.interacoesDirect, max: radarMax['Direct'] },
    { metric: 'Comentários', A: a.comentarios, B: b.comentarios, max: radarMax['Comentários'] },
  ].map((d) => ({ metric: d.metric, A: Math.round((d.A / d.max) * 100), B: Math.round((d.B / d.max) * 100) }))

  return <CompareLayout color={color} titleA={a.titulo} titleB={b.titulo} dateA={a.dataPublicacao} dateB={b.dataPublicacao} rows={rows} radarData={radarData} />
}

// ---------------------------------------------------------------------------
// LinkedIn Comparison
// ---------------------------------------------------------------------------

function LinkedInCompare({ a, b }: { a: TopPostLinkedIn; b: TopPostLinkedIn }) {
  const color = PLATFORM_COLORS.linkedin
  const rows = [
    { label: 'Impressões', a: a.impressoes, b: b.impressoes },
    { label: 'Comentários', a: a.comentarios, b: b.comentarios },
    { label: 'Salvamentos', a: a.salvamentos, b: b.salvamentos },
    { label: 'Dwell Time (s)', a: a.dwellTime, b: b.dwellTime },
    { label: 'Compartilhamentos', a: a.compartilhamentos, b: b.compartilhamentos },
  ]
  const radarData = [
    { metric: 'Impressões', A: a.impressoes, B: b.impressoes, max: 130000 },
    { metric: 'Comentários', A: a.comentarios, B: b.comentarios, max: 700 },
    { metric: 'Salvamentos', A: a.salvamentos, B: b.salvamentos, max: 2500 },
    { metric: 'Dwell Time', A: a.dwellTime, B: b.dwellTime, max: 70 },
    { metric: 'Compart.', A: a.compartilhamentos, B: b.compartilhamentos, max: 1500 },
  ].map((d) => ({ metric: d.metric, A: Math.round((d.A / d.max) * 100), B: Math.round((d.B / d.max) * 100) }))

  return <CompareLayout color={color} titleA={a.titulo} titleB={b.titulo} dateA={a.dataPublicacao} dateB={b.dataPublicacao} rows={rows} radarData={radarData} />
}

// ---------------------------------------------------------------------------
// YouTube Comparison
// ---------------------------------------------------------------------------

function YouTubeCompare({ a, b }: { a: TopPostYouTube; b: TopPostYouTube }) {
  const color = PLATFORM_COLORS.youtube
  const rows = [
    { label: 'Visualizações', a: a.visualizacoes, b: b.visualizacoes },
    { label: 'CTR Thumbnail (%)', a: a.ctrThumbnail, b: b.ctrThumbnail },
    { label: 'Retenção Média (%)', a: a.retencaoMedia, b: b.retencaoMedia },
    { label: 'Watch Time (h)', a: a.watchTime, b: b.watchTime },
    { label: 'Engajamento (%)', a: a.engajamento, b: b.engajamento },
    { label: 'Curtidas', a: a.curtidas, b: b.curtidas },
    { label: 'Comentários', a: a.comentarios, b: b.comentarios },
  ]
  const radarData = [
    { metric: 'Views', A: a.visualizacoes, B: b.visualizacoes, max: 80000 },
    { metric: 'CTR', A: a.ctrThumbnail, B: b.ctrThumbnail, max: 12 },
    { metric: 'Retenção', A: a.retencaoMedia, B: b.retencaoMedia, max: 80 },
    { metric: 'Engajam.', A: a.engajamento, B: b.engajamento, max: 8 },
    { metric: 'Curtidas', A: a.curtidas, B: b.curtidas, max: 3000 },
    { metric: 'Coment.', A: a.comentarios, B: b.comentarios, max: 500 },
  ].map((d) => ({ metric: d.metric, A: Math.round((d.A / d.max) * 100), B: Math.round((d.B / d.max) * 100) }))

  return <CompareLayout color={color} titleA={a.titulo} titleB={b.titulo} dateA={a.dataPublicacao} dateB={b.dataPublicacao} rows={rows} radarData={radarData} />
}

// ---------------------------------------------------------------------------
// Compare Layout (shared)
// ---------------------------------------------------------------------------

function CompareLayout({ color, titleA, titleB, dateA, dateB, rows, radarData }: {
  color: string
  titleA: string; titleB: string
  dateA: string; dateB: string
  rows: { label: string; a: number; b: number }[]
  radarData: { metric: string; A: number; B: number }[]
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Headers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>Post A</span>
          </div>
          <p className="text-sm font-semibold line-clamp-2">{titleA}</p>
          <span className="text-[11px] text-zinc-500">{formatDate(dateA)}</span>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-3 rounded-full bg-cyan-400" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-cyan-400">Post B</span>
          </div>
          <p className="text-sm font-semibold line-clamp-2">{titleB}</p>
          <span className="text-[11px] text-zinc-500">{formatDate(dateB)}</span>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4">
        <div className="grid grid-cols-[1fr_80px_40px_80px] items-center gap-2 pb-2 mb-1 border-b border-zinc-700">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Métrica</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-right" style={{ color }}>Post A</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold text-center">Δ</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-right text-cyan-400">Post B</span>
        </div>
        {rows.map((r) => (
          <CompareRow key={r.label} label={r.label} valA={formatNumber(r.a)} valB={formatNumber(r.b)} rawA={r.a} rawB={r.b} />
        ))}
      </div>

      {/* Radar Chart Overlay */}
      <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Performance Comparada</p>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
              <PolarGrid stroke="#27272a" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar name="Post A" dataKey="A" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Post B" dataKey="B" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type ActivePlatform = 'instagram' | 'linkedin' | 'youtube'

export default function PostAnalyticsPage() {
  const [platform, setPlatform] = useState<ActivePlatform>('instagram')
  const [selectedIg, setSelectedIg] = useState<TopPostInstagram | null>(null)
  const [selectedLi, setSelectedLi] = useState<TopPostLinkedIn | null>(null)
  const [selectedYt, setSelectedYt] = useState<TopPostYouTube | null>(null)

  // Compare mode
  const [compareMode, setCompareMode] = useState(false)
  const [compareIg, setCompareIg] = useState<TopPostInstagram[]>([])
  const [compareLi, setCompareLi] = useState<TopPostLinkedIn[]>([])
  const [compareYt, setCompareYt] = useState<TopPostYouTube[]>([])

  function toggleCompareMode() {
    if (compareMode) {
      setCompareIg([]); setCompareLi([]); setCompareYt([])
    }
    setCompareMode(!compareMode)
  }

  function toggleCompareIg(post: TopPostInstagram) {
    setCompareIg((prev) => prev.find((p) => p.id === post.id) ? prev.filter((p) => p.id !== post.id) : prev.length < 2 ? [...prev, post] : prev)
  }
  function toggleCompareLi(post: TopPostLinkedIn) {
    setCompareLi((prev) => prev.find((p) => p.id === post.id) ? prev.filter((p) => p.id !== post.id) : prev.length < 2 ? [...prev, post] : prev)
  }
  function toggleCompareYt(post: TopPostYouTube) {
    setCompareYt((prev) => prev.find((p) => p.id === post.id) ? prev.filter((p) => p.id !== post.id) : prev.length < 2 ? [...prev, post] : prev)
  }

  function isSelectedIg(id: string) { return compareIg.some((p) => p.id === id) }
  function isSelectedLi(id: string) { return compareLi.some((p) => p.id === id) }
  function isSelectedYt(id: string) { return compareYt.some((p) => p.id === id) }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Análise por Post</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {compareMode
              ? 'Selecione 2 posts para comparar as métricas lado a lado.'
              : 'Clique em um post para ver métricas detalhadas e performance relativa.'}
          </p>
        </div>
        <Button
          variant={compareMode ? 'default' : 'outline'}
          className="gap-2 shrink-0"
          onClick={toggleCompareMode}
        >
          {compareMode ? <XIcon className="size-4" /> : <GitCompareArrowsIcon className="size-4" />}
          {compareMode ? 'Sair da Comparação' : 'Comparar Posts'}
        </Button>
      </div>

      <Tabs value={platform} onValueChange={(v) => { setPlatform(v as ActivePlatform); setCompareIg([]); setCompareLi([]); setCompareYt([]) }}>
        <TabsList>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
        </TabsList>

        {/* Instagram */}
        <TabsContent value="instagram">
          <div className="flex flex-col gap-3 mt-2">
            {sortByDateDesc(mockTopPostsInstagram).map((post) => (
              <div key={post.id} className="relative">
                {compareMode && (
                  <button
                    onClick={() => toggleCompareIg(post)}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelectedIg(post.id)
                        ? 'border-pink-500 bg-pink-500 text-white'
                        : 'border-zinc-600 bg-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {isSelectedIg(post.id) && <CheckIcon className="size-3.5" />}
                  </button>
                )}
                <div className={compareMode ? 'pl-10' : ''}>
                  <PostListCard
                    date={post.dataPublicacao}
                    title={post.titulo}
                    subtitle={`${POST_TYPE_LABELS[post.tipo]} · ${formatDate(post.dataPublicacao)}`}
                    mainMetric={formatNumber(post.alcance)}
                    mainLabel="alcance"
                    secondaryMetrics={[
                      { label: 'Salvamentos', value: formatNumber(post.salvamentos) },
                      { label: 'Compart.', value: formatNumber(post.compartilhamentos) },
                      { label: 'Comentários', value: formatNumber(post.comentarios) },
                    ]}
                    color={PLATFORM_COLORS.instagram}
                    onClick={() => compareMode ? toggleCompareIg(post) : setSelectedIg(post)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Compare Panel */}
          {compareMode && compareIg.length === 2 && (
            <div className="mt-6">
              <InstagramCompare a={compareIg[0]} b={compareIg[1]} />
            </div>
          )}

          <Dialog open={!!selectedIg} onOpenChange={(o) => { if (!o) setSelectedIg(null) }}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="pr-8 text-lg">{selectedIg?.titulo}</DialogTitle>
              </DialogHeader>
              {selectedIg && <InstagramDetail post={selectedIg} />}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* LinkedIn */}
        <TabsContent value="linkedin">
          <div className="flex flex-col gap-3 mt-2">
            {sortByDateDesc(mockTopPostsLinkedIn).map((post) => (
              <div key={post.id} className="relative">
                {compareMode && (
                  <button
                    onClick={() => toggleCompareLi(post)}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelectedLi(post.id)
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-zinc-600 bg-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {isSelectedLi(post.id) && <CheckIcon className="size-3.5" />}
                  </button>
                )}
                <div className={compareMode ? 'pl-10' : ''}>
                  <PostListCard
                    date={post.dataPublicacao}
                    title={post.titulo}
                    subtitle={formatDate(post.dataPublicacao)}
                    mainMetric={formatNumber(post.impressoes)}
                    mainLabel="impressões"
                    secondaryMetrics={[
                      { label: 'Comentários', value: formatNumber(post.comentarios) },
                      { label: 'Salvamentos', value: formatNumber(post.salvamentos) },
                      { label: 'Dwell Time', value: `${post.dwellTime.toFixed(1)}s` },
                    ]}
                    color={PLATFORM_COLORS.linkedin}
                    onClick={() => compareMode ? toggleCompareLi(post) : setSelectedLi(post)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Compare Panel */}
          {compareMode && compareLi.length === 2 && (
            <div className="mt-6">
              <LinkedInCompare a={compareLi[0]} b={compareLi[1]} />
            </div>
          )}

          <Dialog open={!!selectedLi} onOpenChange={(o) => { if (!o) setSelectedLi(null) }}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="pr-8 text-lg">{selectedLi?.titulo}</DialogTitle>
              </DialogHeader>
              {selectedLi && <LinkedInDetail post={selectedLi} />}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* YouTube */}
        <TabsContent value="youtube">
          <div className="flex flex-col gap-3 mt-2">
            {sortByDateDesc(mockTopPostsYouTube).map((post) => (
              <div key={post.id} className="relative">
                {compareMode && (
                  <button
                    onClick={() => toggleCompareYt(post)}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelectedYt(post.id)
                        ? 'border-red-500 bg-red-500 text-white'
                        : 'border-zinc-600 bg-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {isSelectedYt(post.id) && <CheckIcon className="size-3.5" />}
                  </button>
                )}
                <div className={compareMode ? 'pl-10' : ''}>
                  <PostListCard
                    date={post.dataPublicacao}
                    title={post.titulo}
                    subtitle={formatDate(post.dataPublicacao)}
                    mainMetric={formatNumber(post.visualizacoes)}
                    mainLabel="views"
                    secondaryMetrics={[
                      { label: 'CTR', value: `${post.ctrThumbnail}%` },
                      { label: 'Retenção', value: `${post.retencaoMedia}%` },
                      { label: 'Engajam.', value: `${post.engajamento}%` },
                    ]}
                    color={PLATFORM_COLORS.youtube}
                    onClick={() => compareMode ? toggleCompareYt(post) : setSelectedYt(post)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Compare Panel */}
          {compareMode && compareYt.length === 2 && (
            <div className="mt-6">
              <YouTubeCompare a={compareYt[0]} b={compareYt[1]} />
            </div>
          )}

          <Dialog open={!!selectedYt} onOpenChange={(o) => { if (!o) setSelectedYt(null) }}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="pr-8 text-lg">{selectedYt?.titulo}</DialogTitle>
              </DialogHeader>
              {selectedYt && <YouTubeDetail post={selectedYt} />}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
