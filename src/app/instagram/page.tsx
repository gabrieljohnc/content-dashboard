'use client'

import { useState, useMemo, useCallback } from 'react'
import { PlusIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, GripVerticalIcon, Trash2Icon, TargetIcon, UsersIcon, MegaphoneIcon, SparklesIcon } from 'lucide-react'
import { DndContext, DragOverlay, useDroppable, useDraggable, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { mockPosts } from '@/lib/mock-data'
import {
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  POST_FORMAT_LABELS,
  POST_OBJECTIVE_LABELS,
  POST_AUDIENCE_LABELS,
  POST_CTA_LABELS,
} from '@/lib/constants'
import type { Post, Platform, PostStatus, PostFormat, PostObjective, PostAudience, PostCTA } from '@/lib/types'
import { useSupabaseState } from '@/hooks/use-supabase-state'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivePlatform = 'todas' | Platform

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Estágios que exibem o campo "Data de Agendamento" (no card e nos dialogs).
const STATUSES_WITH_DATE: PostStatus[] = ['agendado', 'postado', 'analise']

function statusShowsDate(status: PostStatus): boolean {
  return STATUSES_WITH_DATE.includes(status)
}

// ---------------------------------------------------------------------------
// Sub-components
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

function FormatBadge({ formato }: { formato: PostFormat }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {POST_FORMAT_LABELS[formato]}
    </span>
  )
}

function MetaBadge({ icon: Icon, label, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; tone: 'indigo' | 'cyan' | 'rose' }) {
  const toneClass = {
    indigo: 'bg-indigo-500/15 text-indigo-300',
    cyan: 'bg-cyan-500/15 text-cyan-300',
    rose: 'bg-rose-500/15 text-rose-300',
  }[tone]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${toneClass}`}>
      <Icon className="size-3" />
      <span className="truncate">{label}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Post Detail Dialog
// ---------------------------------------------------------------------------

function PostDetailDialog({ post, onUpdate, open, onOpenChange }: { post: Post; onUpdate: (post: Post) => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({
    titulo: post.titulo,
    legenda: post.legenda,
    formato: post.formato ?? '',
    plataforma: post.plataforma ?? '',
    status: post.status,
    objetivo: post.objetivo ?? '',
    publico: post.publico ?? '',
    mensagemPrincipal: post.mensagemPrincipal ?? '',
    cta: post.cta ?? '',
    dataAgendamento: post.dataAgendamento ? post.dataAgendamento.split('T')[0] : '',
  })

  function handleField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm({ ...form, [key]: value })
  }

  function handleSave() {
    onUpdate({
      ...post,
      titulo: form.titulo.trim(),
      legenda: form.legenda.trim(),
      formato: form.formato ? (form.formato as PostFormat) : undefined,
      plataforma: form.plataforma ? (form.plataforma as Platform) : undefined,
      status: form.status,
      objetivo: form.objetivo ? (form.objetivo as PostObjective) : undefined,
      publico: form.publico ? (form.publico as PostAudience) : undefined,
      mensagemPrincipal: form.mensagemPrincipal.trim() || undefined,
      cta: form.cta ? (form.cta as PostCTA) : undefined,
      dataAgendamento: form.dataAgendamento ? (() => { const [y, m, d] = form.dataAgendamento.split('-').map(Number); return new Date(y, m - 1, d, 12).toISOString() })() : undefined,
      atualizadoEm: new Date().toISOString(),
    })
    onOpenChange(false)
  }

  const isBacklog = form.status === 'backlog'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Post</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Título</label>
            <Input value={form.titulo} onChange={(e) => handleField('titulo', e.target.value)} />
          </div>

          {/* Legenda / Ideia */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{isBacklog ? 'Ideia do post' : 'Legenda'}</label>
            <textarea
              value={form.legenda}
              onChange={(e) => handleField('legenda', e.target.value)}
              rows={isBacklog ? 3 : 5}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 resize-none"
            />
          </div>

          {/* Mensagem principal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Mensagem principal</label>
            <textarea
              placeholder="Qual a mensagem central do post?"
              value={form.mensagemPrincipal}
              onChange={(e) => handleField('mensagemPrincipal', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 resize-none"
            />
          </div>

          {/* Row: Objetivo + Público */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Objetivo</label>
              <Select value={form.objetivo || undefined} onValueChange={(v) => handleField('objetivo', v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Definir objetivo" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(POST_OBJECTIVE_LABELS) as [PostObjective, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Público</label>
              <Select value={form.publico || undefined} onValueChange={(v) => handleField('publico', v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Definir público" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(POST_AUDIENCE_LABELS) as [PostAudience, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: CTA + Formato */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">CTA</label>
              <Select value={form.cta || undefined} onValueChange={(v) => handleField('cta', v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Definir CTA" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(POST_CTA_LABELS) as [PostCTA, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Formato</label>
              <Select value={form.formato || undefined} onValueChange={(v) => handleField('formato', v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Definir formato" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(POST_FORMAT_LABELS) as [PostFormat, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Plataforma + Status */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Plataforma</label>
              <Select value={form.plataforma || undefined} onValueChange={(v) => handleField('plataforma', v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecionar plataforma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={(v) => handleField('status', v as PostStatus)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="aprovacao">Aprovação</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="postado">Postado</SelectItem>
                  <SelectItem value="analise">Análise</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data de Agendamento — só em agendado / postado / analise */}
          {statusShowsDate(form.status) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data de Agendamento</label>
              <Input type="date" value={form.dataAgendamento} onChange={(e) => handleField('dataAgendamento', e.target.value)} />
            </div>
          )}

          {/* Metadata */}
          <div className="flex gap-4 text-[11px] text-muted-foreground/60 pt-1">
            <span>Criado: {formatDate(post.criadoEm)}</span>
            <span>Atualizado: {formatDate(post.atualizadoEm)}</span>
          </div>

          {/* Salvar */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Backlog Card — layout dedicado com campos de curadoria editorial
// ---------------------------------------------------------------------------

function BacklogCardContent({ post, isDragging }: { post: Post; isDragging?: boolean }) {
  return (
    <Card size="sm" className={`${isDragging ? 'opacity-50 ring-1 ring-ring' : 'hover:ring-1 hover:ring-ring/50'} transition-all`}>
      <CardContent className="flex flex-col gap-2.5 pt-3">
        {/* Título */}
        <p className="line-clamp-2 text-sm font-medium leading-snug pr-14">
          {post.titulo}
        </p>

        {/* Ideia do post */}
        {post.legenda && (
          <p className="line-clamp-3 text-xs text-muted-foreground">
            <span className="text-amber-400/80 font-medium">Ideia: </span>
            {post.legenda}
          </p>
        )}

        {/* Mensagem principal */}
        {post.mensagemPrincipal && (
          <p className="line-clamp-2 text-xs text-muted-foreground border-l-2 border-sky-500/40 pl-2">
            <span className="text-sky-400/80 font-medium">Mensagem: </span>
            {post.mensagemPrincipal}
          </p>
        )}

        {/* Badges de formato + plataforma */}
        {(post.plataforma || post.formato) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {post.plataforma && <PlatformBadge platform={post.plataforma} />}
            {post.formato && <FormatBadge formato={post.formato} />}
          </div>
        )}

        {/* Badges de curadoria editorial (objetivo, público, CTA) */}
        {(post.objetivo || post.publico || post.cta) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {post.objetivo && (
              <MetaBadge icon={TargetIcon} label={POST_OBJECTIVE_LABELS[post.objetivo]} tone="indigo" />
            )}
            {post.publico && (
              <MetaBadge icon={UsersIcon} label={POST_AUDIENCE_LABELS[post.publico]} tone="cyan" />
            )}
            {post.cta && (
              <MetaBadge icon={MegaphoneIcon} label={POST_CTA_LABELS[post.cta]} tone="rose" />
            )}
          </div>
        )}

        {/* Placeholder visual quando ainda não curado */}
        {!post.objetivo && !post.publico && !post.cta && !post.mensagemPrincipal && !post.plataforma && !post.formato && (
          <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-muted-foreground/60">
            <SparklesIcon className="size-3" />
            <span>Aguardando curadoria</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Generic Post Card (used by non-backlog columns)
// ---------------------------------------------------------------------------

function PostCardContent({ post, onAprovar, onRejeitar, isDragging }: {
  post: Post
  onAprovar?: (e: React.MouseEvent) => void
  onRejeitar?: (e: React.MouseEvent) => void
  onDelete?: (e: React.MouseEvent) => void
  isDragging?: boolean
}) {
  if (post.status === 'backlog') {
    return <BacklogCardContent post={post} isDragging={isDragging} />
  }

  const scheduleDate = statusShowsDate(post.status) ? (post.dataAgendamento ?? post.dataPublicacao) : undefined
  const showActions = post.status === 'aprovacao' || post.status === 'revisao'
  return (
    <Card size="sm" className={`${isDragging ? 'opacity-50 ring-1 ring-ring' : 'hover:ring-1 hover:ring-ring/50'} transition-all`}>
      <CardHeader className="gap-2 pb-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {post.plataforma && <PlatformBadge platform={post.plataforma} />}
          {post.formato && <FormatBadge formato={post.formato} />}
          {post.tags?.includes('requer-ajuste') && (
            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
              Requer ajuste
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug">
          {post.titulo}
        </p>
        {post.legenda && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {post.legenda}
          </p>
        )}
        {scheduleDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="size-3" />
            <span>{formatDate(scheduleDate)}</span>
          </div>
        )}
        {showActions && onAprovar && onRejeitar && (
          <div className="mt-1 flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              onClick={onAprovar}
            >
              <CheckCircleIcon className="size-3.5" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs"
              onClick={onRejeitar}
            >
              <XCircleIcon className="size-3.5" />
              Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PostCard({ post, onUpdate, onDelete }: { post: Post; onUpdate: (post: Post) => void; onDelete: (id: string) => void }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [agendamentoOpen, setAgendamentoOpen] = useState(false)
  const [dataAgendamento, setDataAgendamento] = useState('')
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  })

  function handleAprovar(e: React.MouseEvent) {
    e.stopPropagation()
    if (post.status === 'aprovacao') {
      onUpdate({
        ...post,
        status: 'producao',
        tags: post.tags?.filter((t) => t !== 'requer-ajuste'),
        atualizadoEm: new Date().toISOString(),
      })
    } else if (post.status === 'revisao') {
      setAgendamentoOpen(true)
    }
  }

  function handleRejeitar(e: React.MouseEvent) {
    e.stopPropagation()
    if (post.status === 'aprovacao') {
      onUpdate({
        ...post,
        status: 'rejeitado',
        atualizadoEm: new Date().toISOString(),
      })
    } else if (post.status === 'revisao') {
      const tags = post.tags?.filter((t) => t !== 'requer-ajuste') ?? []
      onUpdate({
        ...post,
        status: 'producao',
        tags: [...tags, 'requer-ajuste'],
        atualizadoEm: new Date().toISOString(),
      })
    }
  }

  function handleConfirmAgendamento() {
    if (!dataAgendamento) return
    const [y, m, d] = dataAgendamento.split('-').map(Number)
    onUpdate({
      ...post,
      status: 'agendado',
      tags: post.tags?.filter((t) => t !== 'requer-ajuste'),
      dataAgendamento: new Date(y, m - 1, d, 12).toISOString(),
      atualizadoEm: new Date().toISOString(),
    })
    setAgendamentoOpen(false)
    setDataAgendamento('')
  }

  return (
    <>
      <div ref={setNodeRef} className="relative cursor-pointer" onClick={() => { if (!isDragging) setDetailOpen(true) }}>
        {/* Card actions: delete + drag */}
        <div className="absolute top-2.5 right-2 z-10 flex items-center gap-0.5">
          <button
            className="p-0.5 rounded text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); setDeleteOpen(true) }}
          >
            <Trash2Icon className="size-3.5" />
          </button>
          <button
            {...listeners}
            {...attributes}
            className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/80 transition-colors cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVerticalIcon className="size-3.5" />
          </button>
        </div>
        <PostCardContent post={post} onAprovar={handleAprovar} onRejeitar={handleRejeitar} isDragging={isDragging} />
      </div>

      <PostDetailDialog post={post} onUpdate={onUpdate} open={detailOpen} onOpenChange={setDetailOpen} />

      {/* Dialog de agendamento (revisão → agendado) */}
      <Dialog open={agendamentoOpen} onOpenChange={setAgendamentoOpen}>
        <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Agendar Publicação</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Selecione a data para agendamento de &ldquo;{post.titulo}&rdquo;
          </p>
          <Input
            type="date"
            value={dataAgendamento}
            onChange={(e) => setDataAgendamento(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAgendamentoOpen(false)}>Cancelar</Button>
            <Button disabled={!dataAgendamento} onClick={handleConfirmAgendamento}>
              <CalendarIcon className="size-3.5 mr-1.5" />
              Agendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Excluir Post</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir &ldquo;{post.titulo}&rdquo;? Essa ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="gap-1.5" onClick={() => { setDeleteOpen(false); onDelete(post.id) }}>
              <Trash2Icon className="size-3.5" />
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Kanban Column
// ---------------------------------------------------------------------------

const COLUMN_CONFIG: {
  status: PostStatus
  label: string
  color: string
}[] = [
  { status: 'backlog', label: 'Backlog', color: '#71717a' },
  { status: 'aprovacao', label: 'Aprovação', color: '#eab308' },
  { status: 'producao', label: 'Produção', color: '#f97316' },
  { status: 'revisao', label: 'Revisão', color: '#a855f7' },
  { status: 'agendado', label: 'Agendado', color: '#3b82f6' },
  { status: 'postado', label: 'Postado', color: '#22c55e' },
  { status: 'analise', label: 'Análise', color: '#06b6d4' },
  { status: 'rejeitado', label: 'Rejeitado', color: '#ef4444' },
]

function KanbanColumn({
  status,
  label,
  color,
  posts,
  onUpdatePost,
  onDeletePost,
}: {
  status: PostStatus
  label: string
  color: string
  posts: Post[]
  onUpdatePost: (post: Post) => void
  onDeletePost: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  const columnPosts = posts
    .filter((p) => p.status === status)
    .sort((a, b) => {
      const dateA = a.dataAgendamento || a.dataPublicacao || a.criadoEm
      const dateB = b.dataAgendamento || b.dataPublicacao || b.criadoEm
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

  return (
    <div ref={setNodeRef} className={`flex w-72 shrink-0 flex-col gap-3 rounded-lg transition-colors ${isOver ? 'bg-muted/30 ring-2 ring-ring/30' : ''}`}>
      {/* Column header */}
      <div
        className="rounded-t-lg border-t-2 bg-muted/40 px-3 py-2"
        style={{ borderColor: color }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{label}</span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {columnPosts.length}
          </span>
        </div>
      </div>
      {/* Posts */}
      <div className="flex flex-col gap-2 min-h-[60px]">
        {columnPosts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhum post
          </p>
        ) : (
          columnPosts.map((post) => <PostCard key={post.id} post={post} onUpdate={onUpdatePost} onDelete={onDeletePost} />)
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Post Dialog Form
// ---------------------------------------------------------------------------

type FormState = {
  titulo: string
  legenda: string
  formato: PostFormat | ''
  plataforma: Platform | ''
  status: PostStatus
  objetivo: PostObjective | ''
  publico: PostAudience | ''
  mensagemPrincipal: string
  cta: PostCTA | ''
  dataAgendamento: string
}

const DEFAULT_FORM: FormState = {
  titulo: '',
  legenda: '',
  formato: '',
  plataforma: '',
  status: 'backlog',
  objetivo: '',
  publico: '',
  mensagemPrincipal: '',
  cta: '',
  dataAgendamento: '',
}

function NewPostDialog({
  onSave,
}: {
  onSave: (post: Post) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)

  function handleField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm({ ...form, [key]: value })
  }

  function handleSave() {
    if (!form.titulo.trim()) return
    const now = new Date().toISOString()
    const post: Post = {
      id: crypto.randomUUID(),
      titulo: form.titulo.trim(),
      legenda: form.legenda.trim(),
      status: form.status,
      ...(form.formato ? { formato: form.formato } : {}),
      ...(form.plataforma ? { plataforma: form.plataforma } : {}),
      ...(form.objetivo ? { objetivo: form.objetivo } : {}),
      ...(form.publico ? { publico: form.publico } : {}),
      ...(form.mensagemPrincipal.trim() ? { mensagemPrincipal: form.mensagemPrincipal.trim() } : {}),
      ...(form.cta ? { cta: form.cta } : {}),
      ...(form.dataAgendamento
        ? { dataAgendamento: (() => { const [y, m, d] = form.dataAgendamento.split('-').map(Number); return new Date(y, m - 1, d, 12).toISOString() })() }
        : {}),
      criadoEm: now,
      atualizadoEm: now,
    }
    onSave(post)
    setForm(DEFAULT_FORM)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-1.5">
            <PlusIcon />
            Novo Post
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Post</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Título
            </label>
            <Input
              placeholder="Título do post"
              value={form.titulo}
              onChange={(e) => handleField('titulo', e.target.value)}
            />
          </div>

          {/* Ideia / Legenda */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {form.status === 'backlog' ? 'Ideia do post' : 'Legenda'}
            </label>
            <textarea
              placeholder="Descreva a ideia ou legenda..."
              value={form.legenda}
              onChange={(e) => handleField('legenda', e.target.value)}
              rows={form.status === 'backlog' ? 3 : 4}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30 resize-none"
            />
          </div>

          {/* Mensagem principal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Mensagem principal
            </label>
            <textarea
              placeholder="Qual a mensagem central do post?"
              value={form.mensagemPrincipal}
              onChange={(e) => handleField('mensagemPrincipal', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30 resize-none"
            />
          </div>

          {/* Row: Objetivo + Público */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Objetivo</label>
              <Select value={form.objetivo || undefined} onValueChange={(v) => handleField('objetivo', (v ?? '') as PostObjective | '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Definir objetivo" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(POST_OBJECTIVE_LABELS) as [PostObjective, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Público</label>
              <Select value={form.publico || undefined} onValueChange={(v) => handleField('publico', (v ?? '') as PostAudience | '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Definir público" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(POST_AUDIENCE_LABELS) as [PostAudience, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: CTA + Formato */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">CTA</label>
              <Select value={form.cta || undefined} onValueChange={(v) => handleField('cta', (v ?? '') as PostCTA | '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Definir CTA" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(POST_CTA_LABELS) as [PostCTA, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Formato</label>
              <Select value={form.formato || undefined} onValueChange={(v) => handleField('formato', (v ?? '') as PostFormat | '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Definir formato" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(POST_FORMAT_LABELS) as [PostFormat, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Plataforma + Status */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Plataforma</label>
              <Select value={form.plataforma || undefined} onValueChange={(v) => handleField('plataforma', (v ?? '') as Platform | '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Selecionar plataforma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={(v) => handleField('status', v as PostStatus)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="aprovacao">Aprovação</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="postado">Postado</SelectItem>
                  <SelectItem value="analise">Análise</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data de Agendamento — só em agendado / postado / analise */}
          {statusShowsDate(form.status) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Data de Agendamento
              </label>
              <Input
                type="date"
                value={form.dataAgendamento}
                onChange={(e) =>
                  handleField('dataAgendamento', e.target.value)
                }
              />
            </div>
          )}

          {/* Salvar */}
          <div className="flex justify-end pt-1">
            <Button onClick={handleSave} disabled={!form.titulo.trim()}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const PLATFORM_TABS: { value: ActivePlatform; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
]

export default function InstagramPage() {
  const [posts, setPosts] = useSupabaseState<Post[]>(
    '/api/posts',
    'content-dashboard:posts',
    mockPosts
  )
  const [activePlatform, setActivePlatform] =
    useState<ActivePlatform>('todas')
  const [activePost, setActivePost] = useState<Post | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleAddPost(post: Post) {
    setPosts((prev) => [post, ...prev])
  }

  function handleUpdatePost(updated: Post) {
    setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p))
  }

  function handleDeletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id))
    fetch('/api/posts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {})
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const post = event.active.data.current?.post as Post | undefined
    if (post) setActivePost(post)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActivePost(null)
    const { active, over } = event
    if (!over) return
    const postId = active.id as string
    const newStatus = over.id as PostStatus
    const post = posts.find((p) => p.id === postId)
    if (!post || post.status === newStatus) return

    handleUpdatePost({
      ...post,
      status: newStatus,
      atualizadoEm: new Date().toISOString(),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts])

  const filteredPosts = useMemo(() => {
    if (activePlatform === 'todas') return posts
    return posts.filter((p) => p.plataforma === activePlatform)
  }, [posts, activePlatform])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gerenciador de Conteúdo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize e acompanhe seus posts em todas as plataformas.
          </p>
        </div>
        <NewPostDialog onSave={handleAddPost} />
      </div>

      {/* Platform Tabs + Kanban */}
      <Tabs
        value={activePlatform}
        onValueChange={(v) => setActivePlatform(v as ActivePlatform)}
      >
        <TabsList>
          {PLATFORM_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PLATFORM_TABS.map(({ value }) => (
          <TabsContent key={value} value={value}>
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="mt-4 overflow-x-auto scrollbar-visible" style={{ transform: 'rotateX(180deg)' }}>
                <div className="flex gap-4 pb-3" style={{ transform: 'rotateX(180deg)' }}>
                  {COLUMN_CONFIG.map(({ status, label, color }) => (
                    <KanbanColumn
                      key={status}
                      status={status}
                      label={label}
                      color={color}
                      posts={filteredPosts}
                      onUpdatePost={handleUpdatePost}
                      onDeletePost={handleDeletePost}
                    />
                  ))}
                </div>
              </div>
              <DragOverlay>
                {activePost ? (
                  <div className="w-[250px] rotate-2 opacity-90">
                    <PostCardContent post={activePost} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
