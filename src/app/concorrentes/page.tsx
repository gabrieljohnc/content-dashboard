'use client'

import { useState, useMemo, useEffect } from 'react'
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon, Trash2Icon, StickyNoteIcon } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { mockCompetitors } from '@/lib/mock-data'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/lib/constants'
import { useSupabaseState } from '@/hooks/use-supabase-state'
import type { AnalysisNote, Competitor, Platform } from '@/lib/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORMS: Platform[] = ['instagram', 'linkedin', 'youtube']
const AXIS_STYLE = { fill: '#71717a', fontSize: 11 }
const GRID_STYLE = { stroke: '#3f3f46', strokeDasharray: '3 3' }
const CHART_MARGIN = { top: 4, right: 8, left: 0, bottom: 0 }
const LEGEND_STYLE = { fontSize: 12, color: '#a1a1aa' }
const CURSOR_STYLE = { fill: 'rgba(255,255,255,0.04)' }
const BAR_RADIUS: [number, number, number, number] = [3, 3, 0, 0]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('pt-BR')
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Platform Filter
// ---------------------------------------------------------------------------

function PlatformFilter({
  selected,
  onChange,
}: {
  selected: Set<Platform>
  onChange: (next: Set<Platform>) => void
}) {
  function toggle(p: Platform) {
    const next = new Set(selected)
    if (next.has(p)) {
      if (next.size === 1) return
      next.delete(p)
    } else {
      next.add(p)
    }
    onChange(next)
  }

  return (
    <div className="flex items-center gap-2">
      {PLATFORMS.map((p) => {
        const color = PLATFORM_COLORS[p]
        const active = selected.has(p)
        return (
          <button
            key={p}
            onClick={() => toggle(p)}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={
              active
                ? {
                    borderColor: color,
                    backgroundColor: `${color}22`,
                    color,
                  }
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
            {PLATFORM_LABELS[p]}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Platform Badge
// ---------------------------------------------------------------------------

function PlatformBadge({ platform }: { platform: Platform }) {
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

// ---------------------------------------------------------------------------
// Competitor Metrics Card
// ---------------------------------------------------------------------------

function CompetitorCard({
  competitor,
  activePlatforms,
}: {
  competitor: Competitor
  activePlatforms: Set<Platform>
}) {
  const visiblePlatforms = PLATFORMS.filter((p) => activePlatforms.has(p))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{competitor.nome}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {visiblePlatforms.map((p) => {
            const color = PLATFORM_COLORS[p]
            return (
              <div
                key={p}
                className="rounded-lg border p-3"
                style={{ borderColor: `${color}33` }}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-semibold" style={{ color }}>
                    {PLATFORM_LABELS[p]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Seguidores</p>
                    <p className="text-sm font-semibold">
                      {formatNumber(competitor.seguidores[p])}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Engajamento</p>
                    <p className="text-sm font-semibold">
                      {competitor.engajamento[p].toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Frequência</p>
                    <p className="text-sm font-semibold">
                      {competitor.frequenciaPostagem[p]}x/sem
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Crescimento</p>
                    <p
                      className="text-sm font-semibold"
                      style={{
                        color:
                          competitor.crescimento[p] >= 0
                            ? '#22c55e'
                            : '#ef4444',
                      }}
                    >
                      {competitor.crescimento[p] >= 0 ? '+' : ''}
                      {competitor.crescimento[p].toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Comparison Table
// ---------------------------------------------------------------------------

type SortKey =
  | 'nome'
  | 'plataforma'
  | 'seguidores'
  | 'engajamento'
  | 'frequencia'
  | 'crescimento'

type SortDir = 'asc' | 'desc'

interface TableRow {
  competitorId: string
  nome: string
  plataforma: Platform
  seguidores: number
  engajamento: number
  frequencia: number
  crescimento: number
}

function SortIcon({
  column,
  active,
  dir,
}: {
  column: SortKey
  active: SortKey
  dir: SortDir
}) {
  if (column !== active) {
    return <ArrowUpDownIcon className="ml-1 inline size-3 text-muted-foreground" />
  }
  return dir === 'asc' ? (
    <ArrowUpIcon className="ml-1 inline size-3" />
  ) : (
    <ArrowDownIcon className="ml-1 inline size-3" />
  )
}

function ComparisonTable({
  competitors,
  activePlatforms,
}: {
  competitors: Competitor[]
  activePlatforms: Set<Platform>
}) {
  const [sortKey, setSortKey] = useState<SortKey>('nome')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const rows = useMemo<TableRow[]>(() => {
    const result: TableRow[] = []
    for (const c of competitors) {
      for (const p of PLATFORMS) {
        if (!activePlatforms.has(p)) continue
        result.push({
          competitorId: c.id,
          nome: c.nome,
          plataforma: p,
          seguidores: c.seguidores[p],
          engajamento: c.engajamento[p],
          frequencia: c.frequenciaPostagem[p],
          crescimento: c.crescimento[p],
        })
      }
    }

    result.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortKey) {
        case 'nome':
          aVal = a.nome
          bVal = b.nome
          break
        case 'plataforma':
          aVal = a.plataforma
          bVal = b.plataforma
          break
        case 'seguidores':
          aVal = a.seguidores
          bVal = b.seguidores
          break
        case 'engajamento':
          aVal = a.engajamento
          bVal = b.engajamento
          break
        case 'frequencia':
          aVal = a.frequencia
          bVal = b.frequencia
          break
        case 'crescimento':
          aVal = a.crescimento
          bVal = b.crescimento
          break
        default:
          return 0
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal, 'pt-BR')
          : bVal.localeCompare(aVal, 'pt-BR')
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })

    return result
  }, [competitors, activePlatforms, sortKey, sortDir])

  type HeadConfig = { key: SortKey; label: string; align?: 'right' }
  const heads: HeadConfig[] = [
    { key: 'nome', label: 'Concorrente' },
    { key: 'plataforma', label: 'Plataforma' },
    { key: 'seguidores', label: 'Seguidores', align: 'right' },
    { key: 'engajamento', label: 'Engajamento (%)', align: 'right' },
    { key: 'frequencia', label: 'Freq. Postagem', align: 'right' },
    { key: 'crescimento', label: 'Crescimento (%)', align: 'right' },
  ]

  return (
    <Card>
      <CardContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              {heads.map(({ key, label, align }) => (
                <TableHead
                  key={key}
                  className={[
                    'cursor-pointer select-none',
                    align === 'right' ? 'text-right' : '',
                  ]
                    .join(' ')
                    .trim()}
                  onClick={() => handleSort(key)}
                >
                  {label}
                  <SortIcon column={key} active={sortKey} dir={sortDir} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Nenhum dado disponível para as plataformas selecionadas.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow key={`${row.competitorId}-${row.plataforma}-${i}`}>
                  <TableCell className="font-medium">{row.nome}</TableCell>
                  <TableCell>
                    <PlatformBadge platform={row.plataforma} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(row.seguidores)}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.engajamento.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {row.frequencia}x/sem
                  </TableCell>
                  <TableCell
                    className="text-right font-medium"
                    style={{
                      color: row.crescimento >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {row.crescimento >= 0 ? '+' : ''}
                    {row.crescimento.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Recent Posts Section
// ---------------------------------------------------------------------------

function RecentPostsSection({
  competitors,
  activePlatforms,
}: {
  competitors: Competitor[]
  activePlatforms: Set<Platform>
}) {
  const posts = useMemo(() => {
    const result: Array<{
      id: string
      competitorNome: string
      plataforma: Platform
      conteudo: string
      curtidas: number
      comentarios: number
      dataPublicacao: string
    }> = []

    for (const c of competitors) {
      for (const post of c.postsRecentes) {
        if (!activePlatforms.has(post.plataforma)) continue
        result.push({
          id: post.id,
          competitorNome: c.nome,
          plataforma: post.plataforma,
          conteudo: post.conteudo,
          curtidas: post.curtidas,
          comentarios: post.comentarios,
          dataPublicacao: post.dataPublicacao,
        })
      }
    }

    return result.sort(
      (a, b) =>
        new Date(b.dataPublicacao).getTime() -
        new Date(a.dataPublicacao).getTime()
    )
  }, [competitors, activePlatforms])

  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum post recente para as plataformas selecionadas.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <Card key={post.id} size="sm">
          <CardHeader className="gap-1.5 pb-0">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">
                {post.competitorNome}
              </span>
              <PlatformBadge platform={post.plataforma} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {post.conteudo}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>
                  ❤️ {post.curtidas.toLocaleString('pt-BR')}
                </span>
                <span>
                  💬 {post.comentarios.toLocaleString('pt-BR')}
                </span>
              </div>
              <span>{formatDate(post.dataPublicacao)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Growth Trend Chart
// ---------------------------------------------------------------------------

function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-zinc-300">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? `${entry.value.toFixed(1)}%` : entry.value}
        </p>
      ))}
    </div>
  )
}

function GrowthChart({
  competitors,
  activePlatforms,
  isMounted,
}: {
  competitors: Competitor[]
  activePlatforms: Set<Platform>
  isMounted: boolean
}) {
  const chartData = useMemo(() => {
    return competitors.map((c) => {
      const entry: Record<string, string | number> = { nome: c.nome }
      for (const p of PLATFORMS) {
        if (activePlatforms.has(p)) {
          entry[p] = c.crescimento[p]
        }
      }
      return entry
    })
  }, [competitors, activePlatforms])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crescimento por Plataforma (%)</CardTitle>
      </CardHeader>
      <CardContent>
        {isMounted ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={CHART_MARGIN}
            >
              <CartesianGrid {...GRID_STYLE} />
              <XAxis
                dataKey="nome"
                tick={AXIS_STYLE}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={AXIS_STYLE}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                width={44}
              />
              <Tooltip
                content={<DarkTooltip />}
                cursor={CURSOR_STYLE}
              />
              <Legend
                wrapperStyle={LEGEND_STYLE}
                formatter={(value) =>
                  PLATFORM_LABELS[value as Platform] ?? value
                }
              />
              {PLATFORMS.filter((p) => activePlatforms.has(p)).map((p) => (
                <Bar
                  key={p}
                  dataKey={p}
                  name={p}
                  fill={PLATFORM_COLORS[p]}
                  radius={BAR_RADIUS}
                  maxBarSize={32}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] animate-pulse rounded-lg bg-muted/30" />
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Add Competitor Dialog
// ---------------------------------------------------------------------------

type CompetitorForm = {
  nome: string
  instagram: string
  linkedin: string
  youtube: string
}

const DEFAULT_FORM: CompetitorForm = {
  nome: '',
  instagram: '',
  linkedin: '',
  youtube: '',
}

function AddCompetitorDialog({
  onSave,
}: {
  onSave: (competitor: Competitor) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CompetitorForm>(DEFAULT_FORM)

  function handleField<K extends keyof CompetitorForm>(
    key: K,
    value: CompetitorForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!form.nome.trim()) return

    const newCompetitor: Competitor = {
      id: crypto.randomUUID(),
      nome: form.nome.trim(),
      perfis: {
        ...(form.instagram.trim() ? { instagram: form.instagram.trim() } : {}),
        ...(form.linkedin.trim() ? { linkedin: form.linkedin.trim() } : {}),
        ...(form.youtube.trim() ? { youtube: form.youtube.trim() } : {}),
      },
      seguidores: { instagram: 0, linkedin: 0, youtube: 0 },
      engajamento: { instagram: 0, linkedin: 0, youtube: 0 },
      frequenciaPostagem: { instagram: 0, linkedin: 0, youtube: 0 },
      crescimento: { instagram: 0, linkedin: 0, youtube: 0 },
      postsRecentes: [],
    }

    onSave(newCompetitor)
    setForm(DEFAULT_FORM)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-1.5">
            <PlusIcon />
            Adicionar Concorrente
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Concorrente</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Nome
            </label>
            <Input
              placeholder="Ex: Copel, Cemig, Energisa..."
              value={form.nome}
              onChange={(e) => handleField('nome', e.target.value)}
            />
          </div>

          {/* Instagram URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Instagram URL
            </label>
            <Input
              placeholder="@usuario ou URL do perfil"
              value={form.instagram}
              onChange={(e) => handleField('instagram', e.target.value)}
            />
          </div>

          {/* LinkedIn URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              LinkedIn URL
            </label>
            <Input
              placeholder="URL do perfil no LinkedIn"
              value={form.linkedin}
              onChange={(e) => handleField('linkedin', e.target.value)}
            />
          </div>

          {/* YouTube URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              YouTube URL
            </label>
            <Input
              placeholder="URL do canal no YouTube"
              value={form.youtube}
              onChange={(e) => handleField('youtube', e.target.value)}
            />
          </div>

          {/* Save */}
          <div className="flex justify-end pt-1">
            <Button onClick={handleSave} disabled={!form.nome.trim()}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Analysis Notes Section
// ---------------------------------------------------------------------------

function AnalysisNotesSection({
  activePlatforms,
}: {
  activePlatforms: Set<Platform>
}) {
  const [notes, setNotes] = useSupabaseState<AnalysisNote[]>(
    '/api/competitor-notes',
    'content-dashboard:analysis-notes',
    []
  )
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('instagram')
  const [draft, setDraft] = useState('')

  function handleAdd() {
    if (!draft.trim()) return
    const newNote: AnalysisNote = {
      id: crypto.randomUUID(),
      plataforma: selectedPlatform,
      texto: draft.trim(),
      criadoEm: new Date().toISOString(),
    }
    setNotes((prev) => [newNote, ...prev])
    fetch('/api/competitor-notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newNote) }).catch(() => {})
    setDraft('')
  }

  function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    fetch('/api/competitor-notes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {})
  }

  const visiblePlatforms = PLATFORMS.filter((p) => activePlatforms.has(p))

  // Ensure selectedPlatform is visible
  useEffect(() => {
    if (!activePlatforms.has(selectedPlatform) && visiblePlatforms.length > 0) {
      setSelectedPlatform(visiblePlatforms[0])
    }
  }, [activePlatforms, selectedPlatform, visiblePlatforms])

  const filteredNotes = notes.filter((n) => n.plataforma === selectedPlatform)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <StickyNoteIcon className="size-4 text-muted-foreground" />
          <CardTitle>Notas de Análise</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Platform selector */}
        <div className="mb-4 flex items-center gap-2">
          {visiblePlatforms.map((p) => {
            const color = PLATFORM_COLORS[p]
            const active = p === selectedPlatform
            return (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                style={
                  active
                    ? {
                        borderColor: color,
                        backgroundColor: `${color}22`,
                        color,
                      }
                    : {
                        borderColor: '#3f3f46',
                        backgroundColor: 'transparent',
                        color: 'var(--muted-foreground)',
                      }
                }
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: active ? color : 'currentColor' }}
                />
                {PLATFORM_LABELS[p]}
                {notes.filter((n) => n.plataforma === p).length > 0 && (
                  <span
                    className="ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                    style={{ backgroundColor: `${color}33`, color }}
                  >
                    {notes.filter((n) => n.plataforma === p).length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Add note */}
        <div className="mb-4 flex flex-col gap-2">
          <Textarea
            placeholder={`Adicionar nota sobre ${PLATFORM_LABELS[selectedPlatform]}...`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Ctrl+Enter para salvar
            </span>
            <Button
              onClick={handleAdd}
              disabled={!draft.trim()}
              className="gap-1.5"
            >
              <PlusIcon className="size-3.5" />
              Adicionar Nota
            </Button>
          </div>
        </div>

        {/* Notes list */}
        {filteredNotes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma nota para {PLATFORM_LABELS[selectedPlatform]} ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredNotes.map((note) => {
              const color = PLATFORM_COLORS[note.plataforma]
              return (
                <div
                  key={note.id}
                  className="group relative rounded-lg border p-3"
                  style={{ borderColor: `${color}33` }}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                    {note.texto}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.criadoEm).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                      title="Excluir nota"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ConcorrentesPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>(() => {
    if (typeof window === 'undefined') return mockCompetitors
    try {
      const raw = localStorage.getItem('content-dashboard:competitors')
      return raw ? JSON.parse(raw) : mockCompetitors
    } catch { return mockCompetitors }
  })

  // Persist competitors to localStorage on change
  useEffect(() => {
    localStorage.setItem('content-dashboard:competitors', JSON.stringify(competitors))
  }, [competitors])
  const [activePlatforms, setActivePlatforms] = useState<Set<Platform>>(
    new Set(PLATFORMS)
  )
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  function handleAddCompetitor(competitor: Competitor) {
    setCompetitors((prev) => [...prev, competitor])
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Monitoramento de Concorrentes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o desempenho e a estratégia de conteúdo dos seus concorrentes.
          </p>
        </div>
        <AddCompetitorDialog onSave={handleAddCompetitor} />
      </div>

      {/* Platform Filters */}
      <PlatformFilter
        selected={activePlatforms}
        onChange={setActivePlatforms}
      />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="comparison">Comparativos</TabsTrigger>
          <TabsTrigger value="posts">Posts Recentes</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview">
          <div className="flex flex-col gap-8 pt-4">
            {competitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum concorrente cadastrado. Clique em &quot;Adicionar Concorrente&quot; para começar.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {competitors.map((c) => (
                  <CompetitorCard
                    key={c.id}
                    competitor={c}
                    activePlatforms={activePlatforms}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Comparativos */}
        <TabsContent value="comparison">
          <div className="flex flex-col gap-8 pt-4">
            <ComparisonTable
              competitors={competitors}
              activePlatforms={activePlatforms}
            />

            <GrowthChart
              competitors={competitors}
              activePlatforms={activePlatforms}
              isMounted={isMounted}
            />

            <AnalysisNotesSection activePlatforms={activePlatforms} />
          </div>
        </TabsContent>

        {/* Posts Recentes */}
        <TabsContent value="posts">
          <div className="pt-4">
            <RecentPostsSection
              competitors={competitors}
              activePlatforms={activePlatforms}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
