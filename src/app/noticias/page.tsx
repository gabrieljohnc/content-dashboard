'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExternalLinkIcon, RssIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockNews } from '@/lib/mock-data'
import { PLATFORM_COLORS, PLATFORM_LABELS, NEWS_THEME_LABELS } from '@/lib/constants'
import type { NewsItem, Platform } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NewsTheme = NewsItem['tema'] | 'todos'

type RSSRawItem = {
  titulo: string
  fonte: string
  url: string
  dataPublicacao: string
  resumo: string
}

// ---------------------------------------------------------------------------
// Theme classification helpers
// ---------------------------------------------------------------------------

function classifyTheme(titulo: string, resumo: string): NewsItem['tema'] {
  const text = `${titulo} ${resumo}`.toLowerCase()

  if (/regulaç|aneel|resoluç|normativa/.test(text)) return 'regulacao'
  if (/solar|eólica|renov[aá]vel|tecnologia|digital|inteligência artificial|ia |smart/.test(text)) return 'ferramentas'
  if (/pesquisa|estudo|universidade/.test(text)) return 'pesquisa'
  if (/mercado livre|comercializa|consumidor livre/.test(text)) return 'mercado-livre'
  return 'negocios'
}

function suggestPlatforms(titulo: string, resumo: string): Platform[] {
  const text = `${titulo} ${resumo}`.toLowerCase()
  const platforms: Platform[] = []

  if (/mercado|regulaç|gestão|estratégia|profissional/.test(text)) {
    platforms.push('linkedin')
  }
  if (/dica|sustent[aá]vel|consumidor|visual|energia solar/.test(text)) {
    platforms.push('instagram')
  }
  if (/como |tutorial|explicar|entenda|análise/.test(text)) {
    platforms.push('youtube')
  }

  // Ensure at least one platform is assigned
  if (platforms.length === 0) platforms.push('linkedin')

  return platforms
}

// ---------------------------------------------------------------------------
// Normalise RSS items into NewsItem shape
// ---------------------------------------------------------------------------

function normaliseRSSItems(raw: RSSRawItem[]): NewsItem[] {
  return raw.map((item, i) => {
    const tema = classifyTheme(item.titulo, item.resumo)
    const plataformasRelevantes = suggestPlatforms(item.titulo, item.resumo)
    return {
      id: `rss-${i}-${Date.now()}`,
      titulo: item.titulo,
      fonte: item.fonte,
      url: item.url,
      dataPublicacao: item.dataPublicacao,
      resumo: item.resumo,
      tema,
      plataformasRelevantes,
    }
  })
}

// ---------------------------------------------------------------------------
// Theme filter config
// ---------------------------------------------------------------------------

const THEME_FILTERS: { value: NewsTheme; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'pesquisa', label: 'Pesquisa' },
  { value: 'negocios', label: 'Negócios' },
  { value: 'regulacao', label: 'Regulação' },
  { value: 'mercado-livre', label: 'Mercado Livre' },
]

const THEME_COLORS: Record<NewsItem['tema'], string> = {
  ferramentas: '#8b5cf6',
  pesquisa: '#06b6d4',
  negocios: '#f59e0b',
  regulacao: '#ef4444',
  'mercado-livre': '#22c55e',
}

const PLATFORMS: Platform[] = ['instagram', 'linkedin', 'youtube']

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PlatformToggle({
  platform,
  active,
  onToggle,
}: {
  platform: Platform
  active: boolean
  onToggle: () => void
}) {
  const color = PLATFORM_COLORS[platform]
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
      style={
        active
          ? { borderColor: color, backgroundColor: `${color}22`, color }
          : {
              borderColor: 'transparent',
              backgroundColor: 'transparent',
              color: 'var(--muted-foreground)',
            }
      }
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: active ? color : 'currentColor' }}
      />
      {PLATFORM_LABELS[platform]}
    </button>
  )
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const color = PLATFORM_COLORS[platform]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {PLATFORM_LABELS[platform]}
    </span>
  )
}

function ThemeBadge({ tema }: { tema: NewsItem['tema'] }) {
  const color = THEME_COLORS[tema]
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {NEWS_THEME_LABELS[tema]}
    </span>
  )
}

function NewsCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="mb-2 h-4 w-3/4 rounded-md bg-muted/60" />
        <div className="h-4 w-1/2 rounded-md bg-muted/60" />
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex gap-2">
          <div className="h-5 w-16 rounded-full bg-muted/60" />
          <div className="h-5 w-20 rounded-full bg-muted/60" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-muted/40" />
          <div className="h-3 w-5/6 rounded bg-muted/40" />
          <div className="h-3 w-4/6 rounded bg-muted/40" />
        </div>
      </CardContent>
    </Card>
  )
}

function NewsCard({ item }: { item: NewsItem }) {
  let formattedDate = ''
  try {
    formattedDate = format(new Date(item.dataPublicacao), "d 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    })
  } catch {
    formattedDate = item.dataPublicacao
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-1.5 text-sm font-semibold leading-snug hover:text-primary transition-colors"
        >
          <span className="line-clamp-3 flex-1">{item.titulo}</span>
          <ExternalLinkIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Source + Date */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {item.fonte}
          </Badge>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>

        {/* Summary */}
        {item.resumo && (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {item.resumo}
          </p>
        )}

        {/* Footer: platforms + theme */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <ThemeBadge tema={item.tema} />
          {item.plataformasRelevantes.map((p) => (
            <PlatformBadge key={p} platform={p} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function NoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  const [activeTheme, setActiveTheme] = useState<NewsTheme>('todos')
  const [activePlatforms, setActivePlatforms] = useState<Set<Platform>>(new Set())

  // Fetch RSS on mount, fall back to mock if it fails or returns empty
  useEffect(() => {
    async function loadNews() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/rss')
        if (!res.ok) throw new Error('RSS request failed')
        const raw: RSSRawItem[] = await res.json()
        if (Array.isArray(raw) && raw.length > 0) {
          setNews(normaliseRSSItems(raw))
          setUsingMock(false)
        } else {
          throw new Error('Empty RSS response')
        }
      } catch {
        setNews(mockNews)
        setUsingMock(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadNews()
  }, [])

  function togglePlatform(platform: Platform) {
    setActivePlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(platform)) {
        next.delete(platform)
      } else {
        next.add(platform)
      }
      return next
    })
  }

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      // Theme filter
      if (activeTheme !== 'todos' && item.tema !== activeTheme) return false

      // Platform filter — only active if at least one platform is selected
      if (activePlatforms.size > 0) {
        const hasMatch = item.plataformasRelevantes.some((p) => activePlatforms.has(p))
        if (!hasMatch) return false
      }

      return true
    })
  }, [news, activeTheme, activePlatforms])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <RssIcon className="size-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Consolidador de Notícias
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Notícias do mercado de distribuição de energia no Brasil
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Theme filter */}
        <div className="flex flex-wrap items-center gap-2">
          {THEME_FILTERS.map(({ value, label }) => {
            const isActive = activeTheme === value
            const color = value !== 'todos' ? THEME_COLORS[value as NewsItem['tema']] : undefined
            return (
              <button
                key={value}
                onClick={() => setActiveTheme(value)}
                className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                style={
                  isActive && color
                    ? { borderColor: color, backgroundColor: `${color}22`, color }
                    : isActive
                    ? {
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--muted)',
                        color: 'var(--foreground)',
                      }
                    : {
                        borderColor: 'transparent',
                        backgroundColor: 'transparent',
                        color: 'var(--muted-foreground)',
                      }
                }
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Platform relevance filter */}
        <div className="flex items-center gap-2">
          {PLATFORMS.map((p) => (
            <PlatformToggle
              key={p}
              platform={p}
              active={activePlatforms.has(p)}
              onToggle={() => togglePlatform(p)}
            />
          ))}
        </div>
      </div>

      {/* Demo data notice */}
      {usingMock && !isLoading && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          <span className="size-1.5 rounded-full bg-amber-400" />
          Dados de demonstração — os feeds RSS não estão disponíveis no momento.
        </div>
      )}

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Nenhuma notícia encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
