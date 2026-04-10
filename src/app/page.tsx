'use client'

import { useMemo } from 'react'
import {
  FileTextIcon,
  CalendarClockIcon,
  UsersIcon,
  TrendingUpIcon,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { mockPosts, mockMetrics } from '@/lib/mock-data'
import { PLATFORM_COLORS, PLATFORM_LABELS, STATUS_LABELS } from '@/lib/constants'
import type { Post } from '@/lib/types'

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function PlatformBadge({ platform }: { platform: Post['plataforma'] }) {
  const color = PLATFORM_COLORS[platform]
  const label = PLATFORM_LABELS[platform]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: Post['status'] }) {
  const colorMap: Record<Post['status'], string> = {
    backlog: 'bg-zinc-500/20 text-zinc-400',
    aprovacao: 'bg-yellow-500/20 text-yellow-400',
    producao: 'bg-orange-500/20 text-orange-400',
    revisao: 'bg-purple-500/20 text-purple-400',
    agendado: 'bg-blue-500/20 text-blue-400',
    postado: 'bg-green-500/20 text-green-400',
    analise: 'bg-cyan-500/20 text-cyan-400',
    rejeitado: 'bg-red-500/20 text-red-400',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export default function HomePage() {
  const totalPosts = mockPosts.length

  const postsAgendados = useMemo(
    () => mockPosts.filter((p) => p.status === 'agendado').length,
    []
  )

  const seguidoresTotal = useMemo(() => {
    const latestByPlatform: Record<string, number> = {}
    const latestDateByPlatform: Record<string, string> = {}
    for (const metric of mockMetrics) {
      const existingDate = latestDateByPlatform[metric.plataforma]
      if (!existingDate || metric.data > existingDate) {
        latestByPlatform[metric.plataforma] = metric.seguidores
        latestDateByPlatform[metric.plataforma] = metric.data
      }
    }
    return (
      (latestByPlatform['instagram'] ?? 0) +
      (latestByPlatform['linkedin'] ?? 0) +
      (latestByPlatform['youtube'] ?? 0)
    )
  }, [])

  const taxaEngajamentoMedia = useMemo(() => {
    const last30 = mockMetrics.slice(-90)
    if (last30.length === 0) return '0%'
    const total = last30.reduce((sum, m) => {
      const rate = m.seguidores > 0 ? (m.engajamento / m.seguidores) * 100 : 0
      return sum + rate
    }, 0)
    return `${(total / last30.length).toFixed(2)}%`
  }, [])

  const atividadeRecente = useMemo(
    () =>
      [...mockPosts]
        .sort((a, b) => (b.atualizadoEm > a.atualizadoEm ? 1 : -1))
        .slice(0, 5),
    []
  )

  const summaryCards = [
    {
      label: 'Total de Posts',
      value: totalPosts.toString(),
      icon: FileTextIcon,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Posts Agendados',
      value: postsAgendados.toString(),
      icon: CalendarClockIcon,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Seguidores Total',
      value: seguidoresTotal.toLocaleString('pt-BR'),
      icon: UsersIcon,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Taxa de Engajamento Média',
      value: taxaEngajamentoMedia,
      icon: TrendingUpIcon,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard de Marketing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral da estratégia de conteúdo para o setor de distribuição de
          energia elétrica.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <span className={`rounded-lg p-2 ${bg}`}>
                  <Icon className={`size-4 ${color}`} />
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Atividade Recente */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Atividade Recente</h2>
        <Card>
          <CardContent className="pt-4">
            <ul className="divide-y divide-border">
              {atividadeRecente.map((post) => {
                const date =
                  post.dataPublicacao ??
                  post.dataAgendamento ??
                  post.atualizadoEm
                return (
                  <li
                    key={post.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <PlatformBadge platform={post.plataforma} />
                      <span className="text-sm font-medium leading-snug">
                        {post.titulo}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={post.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDate(date)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
