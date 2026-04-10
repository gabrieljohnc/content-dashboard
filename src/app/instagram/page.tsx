'use client'

import { useState, useMemo, useCallback } from 'react'
import { PlusIcon, LinkIcon, UserIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, PencilIcon, ExternalLinkIcon, GripVerticalIcon, Trash2Icon } from 'lucide-react'
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
  POST_TYPE_LABELS,
} from '@/lib/constants'
import type { Post, Platform, PostStatus, PostType } from '@/lib/types'
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

function getDefaultResponsavel(status: PostStatus): string {
  return status === 'aprovacao' ? 'Lucas' : 'John'
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

function TypeBadge({ tipo }: { tipo: PostType }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {POST_TYPE_LABELS[tipo]}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Post Detail Dialog
// ---------------------------------------------------------------------------

function PostDetailDialog({ post, onUpdate, open, onOpenChange }: { post: Post; onUpdate: (post: Post) => void; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [editingCanvaLink, setEditingCanvaLink] = useState(false)
  const [form, setForm] = useState({
    titulo: post.titulo,
    legenda: post.legenda,
    tipo: post.tipo,
    plataforma: post.plataforma,
    status: post.status,
    responsavel: post.responsavel,
    linkCanva: post.linkCanva || '',
    dataAgendamento: post.dataAgendamento ? post.dataAgendamento.split('T')[0] : '',
  })

  function handleField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    const next = { ...form, [key]: value }
    if (key === 'status') {
      next.responsavel = getDefaultResponsavel(value as PostStatus)
    }
    setForm(next)
  }

  function handleSave() {
    onUpdate({
      ...post,
      titulo: form.titulo.trim(),
      legenda: form.legenda.trim(),
      tipo: form.tipo,
      plataforma: form.plataforma,
      status: form.status,
      responsavel: form.responsavel.trim() || getDefaultResponsavel(form.status),
      linkCanva: form.linkCanva.trim() || undefined,
      dataAgendamento: form.dataAgendamento ? (() => { const [y, m, d] = form.dataAgendamento.split('-').map(Number); return new Date(y, m - 1, d, 12).toISOString() })() : undefined,
      atualizadoEm: new Date().toISOString(),
    })
    onOpenChange(false)
  }

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
            <label className="text-xs font-medium text-muted-foreground">{form.status === 'backlog' ? 'Ideia do post' : 'Legenda'}</label>
            <textarea
              value={form.legenda}
              onChange={(e) => handleField('legenda', e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 resize-none"
            />
          </div>

          {/* Row: Tipo + Plataforma */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo de Post</label>
              <Select value={form.tipo} onValueChange={(v) => handleField('tipo', v as PostType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="carrossel">Carrossel</SelectItem>
                  <SelectItem value="reels">Reels</SelectItem>
                  <SelectItem value="stories">Stories</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="artigo">Artigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Plataforma</label>
              <Select value={form.plataforma} onValueChange={(v) => handleField('plataforma', v as Platform)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Status + Responsável */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Responsável</label>
              <Input value={form.responsavel} onChange={(e) => handleField('responsavel', e.target.value)} />
            </div>
          </div>

          {/* Row: Data + Link Canva */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data de Agendamento</label>
              <Input type="date" value={form.dataAgendamento} onChange={(e) => handleField('dataAgendamento', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Link da Arte (Canva)</label>
              {editingCanvaLink || !form.linkCanva ? (
                <div className="flex gap-1.5">
                  <Input
                    autoFocus={editingCanvaLink}
                    placeholder="https://www.canva.com/design/..."
                    value={form.linkCanva}
                    onChange={(e) => handleField('linkCanva', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && form.linkCanva.trim()) setEditingCanvaLink(false) }}
                  />
                  {editingCanvaLink && form.linkCanva.trim() && (
                    <Button size="sm" variant="outline" onClick={() => setEditingCanvaLink(false)}>OK</Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 h-9 rounded-lg border border-input bg-transparent px-2.5">
                  <a
                    href={form.linkCanva}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors truncate flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLinkIcon className="size-3.5 shrink-0" />
                    <span className="truncate">Abrir no Canva</span>
                  </a>
                  <button
                    className="text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
                    onClick={() => setEditingCanvaLink(true)}
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

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
// Post Card
// ---------------------------------------------------------------------------

function PostCardContent({ post, onAprovar, onRejeitar, onDelete, isDragging }: {
  post: Post
  onAprovar?: (e: React.MouseEvent) => void
  onRejeitar?: (e: React.MouseEvent) => void
  onDelete?: (e: React.MouseEvent) => void
  isDragging?: boolean
}) {
  const scheduleDate = post.dataAgendamento ?? post.dataPublicacao
  const showActions = post.status === 'aprovacao' || post.status === 'revisao'
  return (
    <Card size="sm" className={`${isDragging ? 'opacity-50 ring-1 ring-ring' : 'hover:ring-1 hover:ring-ring/50'} transition-all`}>
      <CardHeader className="gap-2 pb-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <PlatformBadge platform={post.plataforma} />
          <TypeBadge tipo={post.tipo} />
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
            {post.status === 'backlog' ? <span className="text-amber-400/70 font-medium">Ideia: </span> : null}
            {post.legenda}
          </p>
        )}
        {scheduleDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="size-3" />
            <span>{formatDate(scheduleDate)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserIcon className="size-3" />
          <span>{post.responsavel}</span>
        </div>
        {post.linkCanva && (
          <div className="flex items-center gap-1.5 text-xs">
            <LinkIcon className="size-3 text-muted-foreground" />
            <span className="truncate text-blue-400">Arte no Canva</span>
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
        responsavel: 'John',
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
  tipo: PostType
  plataforma: Platform
  status: PostStatus
  responsavel: string
  linkCanva: string
  dataAgendamento: string
}

const DEFAULT_FORM: FormState = {
  titulo: '',
  legenda: '',
  tipo: 'feed',
  plataforma: 'instagram',
  status: 'backlog',
  responsavel: 'John',
  linkCanva: '',
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
    const next = { ...form, [key]: value }
    // Auto-set responsável when status changes
    if (key === 'status') {
      next.responsavel = getDefaultResponsavel(value as PostStatus)
    }
    setForm(next)
  }

  function handleSave() {
    if (!form.titulo.trim()) return
    const now = new Date().toISOString()
    const post: Post = {
      id: crypto.randomUUID(),
      titulo: form.titulo.trim(),
      legenda: form.legenda.trim(),
      tipo: form.tipo,
      plataforma: form.plataforma,
      status: form.status,
      responsavel: form.responsavel.trim() || getDefaultResponsavel(form.status),
      ...(form.linkCanva.trim() ? { linkCanva: form.linkCanva.trim() } : {}),
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
      <DialogContent className="sm:max-w-lg">
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

          {/* Legenda */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Legenda
            </label>
            <textarea
              placeholder="Legenda do post..."
              value={form.legenda}
              onChange={(e) => handleField('legenda', e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30 resize-none"
            />
          </div>

          {/* Row: Tipo + Plataforma */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tipo de Post
              </label>
              <Select
                value={form.tipo}
                onValueChange={(v) => handleField('tipo', v as PostType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="carrossel">Carrossel</SelectItem>
                  <SelectItem value="reels">Reels</SelectItem>
                  <SelectItem value="stories">Stories</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="artigo">Artigo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Plataforma
              </label>
              <Select
                value={form.plataforma}
                onValueChange={(v) =>
                  handleField('plataforma', v as Platform)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Status + Responsável */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <Select
                value={form.status}
                onValueChange={(v) => handleField('status', v as PostStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Responsável
              </label>
              <Input
                placeholder="Nome do responsável"
                value={form.responsavel}
                onChange={(e) => handleField('responsavel', e.target.value)}
              />
            </div>
          </div>

          {/* Row: Data + Link Canva */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Link da Arte (Canva)
              </label>
              <Input
                placeholder="https://www.canva.com/design/..."
                value={form.linkCanva}
                onChange={(e) => handleField('linkCanva', e.target.value)}
              />
            </div>
          </div>

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
      responsavel: getDefaultResponsavel(newStatus),
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
