'use client'

import { useState, useMemo } from 'react'
import { PlusIcon } from 'lucide-react'
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
  STATUS_LABELS,
  POST_TYPE_LABELS,
} from '@/lib/constants'
import type { Post, Platform, PostStatus, PostType } from '@/lib/types'
import { useLocalStorage } from '@/hooks/use-local-storage'

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
// Post Card
// ---------------------------------------------------------------------------

function PostCard({ post }: { post: Post }) {
  const scheduleDate = post.dataAgendamento ?? post.dataPublicacao
  return (
    <Card size="sm" className="cursor-default">
      <CardHeader className="gap-2 pb-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <PlatformBadge platform={post.plataforma} />
          <TypeBadge tipo={post.tipo} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm font-medium leading-snug">
          {post.titulo}
        </p>
        {post.legenda && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {post.legenda}
          </p>
        )}
        {scheduleDate && (
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDate(scheduleDate)}
          </p>
        )}
      </CardContent>
    </Card>
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
  { status: 'rascunho', label: 'Rascunho', color: '#eab308' },
  { status: 'agendado', label: 'Agendado', color: '#3b82f6' },
  { status: 'publicado', label: 'Publicado', color: '#22c55e' },
]

function KanbanColumn({
  status,
  label,
  color,
  posts,
}: {
  status: PostStatus
  label: string
  color: string
  posts: Post[]
}) {
  const columnPosts = posts.filter((p) => p.status === status)
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
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
      <div className="flex flex-col gap-2">
        {columnPosts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhum post
          </p>
        ) : (
          columnPosts.map((post) => <PostCard key={post.id} post={post} />)
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
  dataAgendamento: string
}

const DEFAULT_FORM: FormState = {
  titulo: '',
  legenda: '',
  tipo: 'feed',
  plataforma: 'instagram',
  status: 'backlog',
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
    setForm((prev) => ({ ...prev, [key]: value }))
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
      ...(form.dataAgendamento
        ? { dataAgendamento: new Date(form.dataAgendamento).toISOString() }
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

          {/* Row: Status + Data */}
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
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="publicado">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
  const [posts, setPosts] = useLocalStorage<Post[]>(
    'content-dashboard:posts',
    mockPosts
  )
  const [activePlatform, setActivePlatform] =
    useState<ActivePlatform>('todas')

  function handleAddPost(post: Post) {
    setPosts((prev) => [post, ...prev])
  }

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
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {COLUMN_CONFIG.map(({ status, label, color }) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  label={label}
                  color={color}
                  posts={filteredPosts}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
