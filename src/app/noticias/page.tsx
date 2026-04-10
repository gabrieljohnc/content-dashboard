'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ExternalLinkIcon,
  NewspaperIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  HelpCircleIcon,
  MapPinIcon,
  BuildingIcon,
  CalendarIcon,
  FileTextIcon,
  BarChart3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types (matching Xano response)
// ---------------------------------------------------------------------------

interface SinalAmarelo {
  existe: boolean
  motivo: string
}

interface CriterioScore {
  nota: number
  peso: number
  justificativa: string
}

interface SinaisExtracao {
  entidades: string[]
  localidades: string[]
  normas_documentos: string[]
  prazos_relevantes: string[]
  materiais_afetados: string[]
  indicadores_afetados: string[]
}

interface JsonAvaliacao {
  titulo: string
  decisao: 'Publicar' | 'Talvez' | 'Descartar'
  localidade: string
  nota_final: number
  observacoes: string
  sinal_amarelo: SinalAmarelo
  data_publicacao: string
  secao_principal: string
  secao_secundaria: string | null
  sinais_extracao: SinaisExtracao
  cortes_disparados: Record<string, boolean>
  pontuacao_criterios: Record<string, CriterioScore>
}

interface Noticia {
  id: number
  created_at: number
  nome_portal: string
  title: string
  link: string
  content: string
  secao_principal: string
  secao_secundaria: string
  nota_final: number
  json_avaliacao: JsonAvaliacao
  utilizado_news_gestao: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECAO_COLORS: Record<string, string> = {
  'Regulação': '#ef4444',
  'Inovação & Tecnologia': '#8b5cf6',
  'Finanças & Investimentos': '#f59e0b',
  'Estratégia & Mercado': '#3b82f6',
  'Notícias Setoriais': '#6b7280',
  'Operações & Eficiência': '#10b981',
  'Compliance & Sustentabilidade': '#22d3ee',
  'Panorama Internacional': '#ec4899',
  'Pessoas & Gestão': '#a855f7',
}

const DECISAO_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  'Publicar': { color: '#22c55e', bg: '#22c55e15', icon: CheckCircleIcon },
  'Talvez': { color: '#eab308', bg: '#eab30815', icon: HelpCircleIcon },
  'Descartar': { color: '#ef4444', bg: '#ef444415', icon: XCircleIcon },
}

const PORTAL_COLORS: Record<string, string> = {
  'Canal Energia': '#0ea5e9',
  'Ministério de Minas e Energia': '#16a34a',
  'O Setor Elétrico': '#f97316',
  'Agência Nacional de Energia Elétrica': '#dc2626',
  'Empresa de Pesquisa Energética': '#7c3aed',
}

const CRITERIO_LABELS: Record<string, string> = {
  recencia: 'Recência',
  evidencias_dados: 'Evidências & Dados',
  aderencia_publico: 'Aderência ao Público',
  decisao_gerencial: 'Decisão Gerencial',
  compras_homologacao: 'Compras & Homologação',
  impacto_regulatorio: 'Impacto Regulatório',
  inovacao_tecnologia: 'Inovação & Tecnologia',
  operacoes_eficiencia: 'Operações & Eficiência',
  escopo_transferibilidade: 'Escopo & Transferibilidade',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function notaColor(nota: number): string {
  if (nota >= 8) return '#22c55e'
  if (nota >= 6) return '#eab308'
  if (nota >= 4) return '#f97316'
  return '#ef4444'
}

function notaBg(nota: number): string {
  return `${notaColor(nota)}18`
}

// ---------------------------------------------------------------------------
// Tag list component
// ---------------------------------------------------------------------------

function TagList({ items, color, icon: Icon, label }: { items: string[]; color: string; icon: React.ElementType; label: string }) {
  if (!items || items.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3" style={{ color }} />
        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span key={i} className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300">{item}</span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score bar
// ---------------------------------------------------------------------------

function ScoreBar({ label, nota, peso, justificativa }: { label: string; nota: number; peso: number; justificativa: string }) {
  const width = (nota / 10) * 100
  const color = notaColor(nota)
  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] text-zinc-400">{label}</span>
        <span className="text-[11px] font-semibold" style={{ color }}>{nota}/10 <span className="text-zinc-600 font-normal">(peso {peso})</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <div className="hidden group-hover:block absolute z-20 bottom-full left-0 mb-1 w-72 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-[11px] text-zinc-300 shadow-xl">
        {justificativa}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// News Card
// ---------------------------------------------------------------------------

function NewsCard({ noticia, onAprovar, onRejeitar }: { noticia: Noticia; onAprovar?: (id: number) => void; onRejeitar?: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const av = noticia.json_avaliacao
  const decisaoConf = DECISAO_CONFIG[av?.decisao] || DECISAO_CONFIG['Talvez']
  const DecisaoIcon = decisaoConf.icon
  const secaoColor = SECAO_COLORS[noticia.secao_principal] || '#6b7280'
  const portalColor = PORTAL_COLORS[noticia.nome_portal] || '#6b7280'

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Top color accent */}
      <div className="h-1" style={{ backgroundColor: secaoColor }} />

      <CardHeader className="pb-2 gap-3">
        {/* Row: badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Nota */}
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold"
            style={{ backgroundColor: notaBg(noticia.nota_final), color: notaColor(noticia.nota_final) }}
          >
            {noticia.nota_final.toFixed(1)}
          </span>
          {/* Decisão */}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: decisaoConf.bg, color: decisaoConf.color }}
          >
            <DecisaoIcon className="size-3" />
            {av?.decisao || '—'}
          </span>
          {/* Seção */}
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${secaoColor}18`, color: secaoColor }}
          >
            {noticia.secao_principal || 'Sem seção'}
          </span>
          {noticia.secao_secundaria && (
            <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
              {noticia.secao_secundaria}
            </span>
          )}
        </div>

        {/* Title */}
        <a
          href={noticia.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-1.5 text-sm font-semibold leading-snug hover:text-primary transition-colors"
        >
          <span className="flex-1">{noticia.title}</span>
          <ExternalLinkIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Portal + Data */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: `${portalColor}15`, color: portalColor }}
          >
            {noticia.nome_portal}
          </span>
          {av?.data_publicacao && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              <CalendarIcon className="size-3" />
              {formatDate(av.data_publicacao)}
            </span>
          )}
          {av?.localidade && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              <MapPinIcon className="size-3" />
              {av.localidade}
            </span>
          )}
        </div>

        {/* Observações */}
        {av?.observacoes && (
          <p className="text-xs leading-relaxed text-zinc-400">
            {av.observacoes}
          </p>
        )}

        {/* Aprovar / Rejeitar for "Talvez" */}
        {av?.decisao === 'Talvez' && onAprovar && onRejeitar && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              onClick={() => onAprovar(noticia.id)}
            >
              <CheckCircleIcon className="size-3.5" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs"
              onClick={() => onRejeitar(noticia.id)}
            >
              <XCircleIcon className="size-3.5" />
              Rejeitar
            </Button>
          </div>
        )}

        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 w-fit"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUpIcon className="size-3.5" /> : <ChevronDownIcon className="size-3.5" />}
          {expanded ? 'Menos detalhes' : 'Mais detalhes'}
        </Button>

        {expanded && (
          <div className="flex flex-col gap-4 border-t border-zinc-800/50 pt-3">
            {/* Sinais de extração */}
            {av?.sinais_extracao && (
              <div className="flex flex-col gap-3">
                <TagList items={av.sinais_extracao.entidades} color="#60a5fa" icon={BuildingIcon} label="Entidades" />
                <TagList items={av.sinais_extracao.localidades} color="#34d399" icon={MapPinIcon} label="Localidades" />
                <TagList items={av.sinais_extracao.normas_documentos} color="#f472b6" icon={FileTextIcon} label="Normas & Documentos" />
                <TagList items={av.sinais_extracao.prazos_relevantes} color="#fbbf24" icon={CalendarIcon} label="Prazos Relevantes" />
                <TagList items={av.sinais_extracao.indicadores_afetados} color="#a78bfa" icon={BarChart3Icon} label="Indicadores Afetados" />
                <TagList items={av.sinais_extracao.materiais_afetados} color="#fb923c" icon={BuildingIcon} label="Materiais Afetados" />
              </div>
            )}

            {/* Pontuação por critério */}
            {av?.pontuacao_criterios && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Pontuação por Critério</span>
                <div className="flex flex-col gap-2">
                  {Object.entries(av.pontuacao_criterios).map(([key, crit]) => (
                    <ScoreBar
                      key={key}
                      label={CRITERIO_LABELS[key] || key}
                      nota={crit.nota}
                      peso={crit.peso}
                      justificativa={crit.justificativa}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cortes disparados */}
            {av?.cortes_disparados && Object.values(av.cortes_disparados).some(Boolean) && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-red-400">Cortes Disparados</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(av.cortes_disparados).filter(([, v]) => v).map(([key]) => (
                    <span key={key} className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-400">
                      {key.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function NewsCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="h-1 bg-zinc-800" />
      <CardHeader className="pb-2">
        <div className="flex gap-2 mb-2">
          <div className="h-5 w-10 rounded-full bg-muted/60" />
          <div className="h-5 w-16 rounded-full bg-muted/60" />
          <div className="h-5 w-20 rounded-full bg-muted/60" />
        </div>
        <div className="h-4 w-3/4 rounded-md bg-muted/60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-3 w-1/3 rounded bg-muted/40" />
          <div className="h-3 w-full rounded bg-muted/40" />
          <div className="h-3 w-5/6 rounded bg-muted/40" />
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Auto-send "Publicar" to Backlog
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// API helpers for processadas, overrides, and posts
// ---------------------------------------------------------------------------

async function fetchProcessedIds(): Promise<Set<number>> {
  try {
    const res = await fetch('/api/noticias-processadas')
    if (!res.ok) throw new Error('fetch failed')
    const ids: number[] = await res.json()
    return new Set(ids)
  } catch {
    try { return new Set(JSON.parse(localStorage.getItem('content-dashboard:noticias-processadas') || '[]')) } catch { return new Set() }
  }
}

async function markProcessed(ids: number[]): Promise<void> {
  fetch('/api/noticias-processadas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }).catch(() => {})
}

async function syncPublicarToBacklog(noticias: Noticia[]) {
  const processed = await fetchProcessedIds()
  const isFirstLoad = processed.size === 0

  const publicar = noticias.filter((n) => n.json_avaliacao?.decisao === 'Publicar')

  if (isFirstLoad) {
    const allIds = noticias.map((n) => n.id)
    markProcessed(allIds)
    return
  }

  const newPublicar = publicar.filter((n) => !processed.has(n.id))
  if (newPublicar.length === 0) return

  const now = new Date().toISOString()
  const newPosts = newPublicar.map((noticia) => ({
    id: crypto.randomUUID(),
    titulo: noticia.title,
    legenda: noticia.link,
    tipo: 'feed',
    plataforma: 'instagram',
    status: 'backlog',
    responsavel: 'John',
    criadoEm: now,
    atualizadoEm: now,
  }))

  fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPosts) }).catch(() => {})
  markProcessed(newPublicar.map((n) => n.id))
}

function sendNoticiaToBacklog(noticia: Noticia) {
  const now = new Date().toISOString()
  const newPost = {
    id: crypto.randomUUID(),
    titulo: noticia.title,
    legenda: noticia.link,
    tipo: 'feed',
    plataforma: 'instagram',
    status: 'backlog',
    responsavel: 'John',
    criadoEm: now,
    atualizadoEm: now,
  }
  fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPost) }).catch(() => {})
  markProcessed([noticia.id])
}

async function fetchOverrides(): Promise<Record<number, string>> {
  try {
    const res = await fetch('/api/noticias-overrides')
    if (!res.ok) throw new Error('fetch failed')
    return await res.json()
  } catch {
    try { return JSON.parse(localStorage.getItem('content-dashboard:noticias-overrides') || '{}') } catch { return {} }
  }
}

function saveOverride(id: number, decisao: string) {
  fetch('/api/noticias-overrides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ noticia_id: id, decisao }) }).catch(() => {})
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const ALL_SECOES = [
  'Regulação',
  'Inovação & Tecnologia',
  'Finanças & Investimentos',
  'Estratégia & Mercado',
  'Notícias Setoriais',
  'Operações & Eficiência',
  'Compliance & Sustentabilidade',
  'Panorama Internacional',
  'Pessoas & Gestão',
]

const ALL_DECISOES = ['Publicar', 'Talvez', 'Descartar']

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [overrides, setOverrides] = useState<Record<number, string>>({})

  // Filters
  const [search, setSearch] = useState('')
  const [secaoFilter, setSecaoFilter] = useState<string>('todos')
  const [decisaoFilter, setDecisaoFilter] = useState<string>('todos')
  const [portalFilter, setPortalFilter] = useState<string>('todos')
  const [sortBy, setSortBy] = useState<'nota' | 'data'>('data')

  useEffect(() => {
    fetchOverrides().then(setOverrides)
  }, [])

  function handleAprovar(id: number) {
    const noticia = noticias.find((n) => n.id === id)
    if (!noticia) return
    saveOverride(id, 'Publicar')
    setOverrides((prev) => ({ ...prev, [id]: 'Publicar' }))
    sendNoticiaToBacklog(noticia)
  }

  function handleRejeitar(id: number) {
    saveOverride(id, 'Descartar')
    setOverrides((prev) => ({ ...prev, [id]: 'Descartar' }))
  }

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/noticias')
        if (!res.ok) throw new Error('Fetch failed')
        const data: Noticia[] = await res.json()
        syncPublicarToBacklog(data)
        setNoticias(data)
      } catch (err) {
        console.error('Failed to load noticias:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const portals = useMemo(() => [...new Set(noticias.map((n) => n.nome_portal))], [noticias])

  // Apply local overrides to decisão
  const noticiasWithOverrides = useMemo(() => {
    return noticias.map((n) => {
      const override = overrides[n.id]
      if (!override || !n.json_avaliacao) return n
      return { ...n, json_avaliacao: { ...n.json_avaliacao, decisao: override as Noticia['json_avaliacao']['decisao'] } }
    })
  }, [noticias, overrides])

  const filtered = useMemo(() => {
    let result = noticiasWithOverrides

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((n) =>
        n.title.toLowerCase().includes(q) ||
        n.json_avaliacao?.observacoes?.toLowerCase().includes(q) ||
        n.nome_portal.toLowerCase().includes(q)
      )
    }

    if (secaoFilter !== 'todos') {
      result = result.filter((n) => n.secao_principal === secaoFilter)
    }

    if (decisaoFilter !== 'todos') {
      result = result.filter((n) => n.json_avaliacao?.decisao === decisaoFilter)
    }

    if (portalFilter !== 'todos') {
      result = result.filter((n) => n.nome_portal === portalFilter)
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'nota') return b.nota_final - a.nota_final
      const dateA = a.json_avaliacao?.data_publicacao || ''
      const dateB = b.json_avaliacao?.data_publicacao || ''
      return dateB.localeCompare(dateA)
    })

    return result
  }, [noticiasWithOverrides, search, secaoFilter, decisaoFilter, portalFilter, sortBy])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <NewspaperIcon className="size-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Notícias do Setor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Carregando...' : `${filtered.length} de ${noticias.length} notícias`}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, observação ou portal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Seção */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSecaoFilter('todos')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              secaoFilter === 'todos' ? 'border-zinc-500 bg-zinc-800 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Todas as seções
          </button>
          {ALL_SECOES.map((s) => {
            const c = SECAO_COLORS[s] || '#6b7280'
            const active = secaoFilter === s
            return (
              <button
                key={s}
                onClick={() => setSecaoFilter(active ? 'todos' : s)}
                className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                style={active ? { borderColor: c, backgroundColor: `${c}18`, color: c } : { borderColor: 'transparent', color: '#71717a' }}
              >
                {s}
              </button>
            )
          })}
        </div>

        {/* Decisão + Portal + Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {ALL_DECISOES.map((d) => {
            const conf = DECISAO_CONFIG[d]
            const active = decisaoFilter === d
            return (
              <button
                key={d}
                onClick={() => setDecisaoFilter(active ? 'todos' : d)}
                className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                style={active ? { borderColor: conf.color, backgroundColor: conf.bg, color: conf.color } : { borderColor: 'transparent', color: '#71717a' }}
              >
                {d}
              </button>
            )
          })}

          <span className="text-zinc-700">|</span>

          {/* Portal filter */}
          <select
            value={portalFilter}
            onChange={(e) => setPortalFilter(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-600"
          >
            <option value="todos">Todos os portais</option>
            {portals.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <span className="text-zinc-700">|</span>

          {/* Sort */}
          <button
            onClick={() => setSortBy(sortBy === 'nota' ? 'data' : 'nota')}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Ordenar: {sortBy === 'nota' ? 'Nota ↓' : 'Data ↓'}
          </button>
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <NewsCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Nenhuma notícia encontrada para os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((n) => <NewsCard key={n.id} noticia={n} onAprovar={handleAprovar} onRejeitar={handleRejeitar} />)}
        </div>
      )}
    </div>
  )
}
