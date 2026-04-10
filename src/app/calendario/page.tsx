'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { mockPosts } from '@/lib/mock-data'
import {
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  POST_TYPE_LABELS,
} from '@/lib/constants'
import type { Post, Platform } from '@/lib/types'
import { useSupabaseState } from '@/hooks/use-supabase-state'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLATFORMS: Platform[] = ['instagram', 'linkedin', 'youtube']

const DAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPostDate(post: Post): string | undefined {
  return post.dataAgendamento ?? post.dataPublicacao
}

function formatPostDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncateTitle(title: string, max = 15): string {
  return title.length > max ? title.slice(0, max).trimEnd() + '…' : title
}

// ---------------------------------------------------------------------------
// Platform Filter Button
// ---------------------------------------------------------------------------

function PlatformFilterButton({
  platform,
  active,
  onToggle,
}: {
  platform: Platform
  active: boolean
  onToggle: () => void
}) {
  const color = PLATFORM_COLORS[platform]
  const label = PLATFORM_LABELS[platform]

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all"
      style={{
        borderColor: active ? color : 'transparent',
        backgroundColor: active ? `${color}22` : 'rgba(255,255,255,0.04)',
        color: active ? color : '#71717a',
        outline: 'none',
      }}
    >
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: active ? color : '#52525b' }}
      />
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Post Chip
// ---------------------------------------------------------------------------

function PostChip({
  post,
  onClick,
}: {
  post: Post
  onClick: (post: Post) => void
}) {
  const color = PLATFORM_COLORS[post.plataforma]

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick(post)
      }}
      title={post.titulo}
      className="flex w-full items-center rounded px-1.5 py-0.5 text-left text-xs font-medium transition-opacity hover:opacity-80"
      style={{ backgroundColor: `${color}33`, color }}
    >
      <span className="truncate">{truncateTitle(post.titulo)}</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Calendar Day Cell
// ---------------------------------------------------------------------------

function DayCell({
  day,
  currentMonth,
  today,
  posts,
  onChipClick,
}: {
  day: Date
  currentMonth: Date
  today: Date
  posts: Post[]
  onChipClick: (post: Post) => void
}) {
  const isCurrentMonth = isSameMonth(day, currentMonth)
  const isToday = isSameDay(day, today)

  const dayPosts = posts.filter((post) => {
    const dateStr = getPostDate(post)
    if (!dateStr) return false
    try {
      // Extract YYYY-MM-DD to avoid timezone shift issues
      const datePart = dateStr.slice(0, 10)
      const [y, m, d] = datePart.split('-').map(Number)
      const localDate = new Date(y, m - 1, d)
      return isSameDay(localDate, day)
    } catch {
      return false
    }
  })

  return (
    <div
      className={[
        'flex min-h-[60px] md:min-h-[110px] flex-col gap-1 border-b border-r border-zinc-800 p-1 md:p-2',
        isCurrentMonth ? 'bg-zinc-900' : 'bg-zinc-950',
      ].join(' ')}
    >
      {/* Day number */}
      <div className="flex items-center justify-end">
        <span
          className={[
            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
            isToday
              ? 'bg-indigo-500 text-white'
              : isCurrentMonth
                ? 'text-zinc-200'
                : 'text-zinc-600',
          ].join(' ')}
        >
          {format(day, 'd')}
        </span>
      </div>

      {/* Post chips */}
      <div className="flex flex-col gap-0.5">
        {dayPosts.map((post) => (
          <PostChip key={post.id} post={post} onClick={onChipClick} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Post Detail Dialog
// ---------------------------------------------------------------------------

function PostDetailDialog({
  post,
  open,
  onOpenChange,
}: {
  post: Post | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!post) return null

  const color = PLATFORM_COLORS[post.plataforma]
  const dateStr = getPostDate(post)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-6 leading-snug">{post.titulo}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-1">
          {/* Plataforma badge */}
          <span
            className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {PLATFORM_LABELS[post.plataforma]}
          </span>

          {/* Details grid */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-zinc-500">Tipo</dt>
              <dd className="text-zinc-200">{POST_TYPE_LABELS[post.tipo]}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-zinc-500">Status</dt>
              <dd className="text-zinc-200">{STATUS_LABELS[post.status]}</dd>
            </div>
            <div className="col-span-2 flex flex-col gap-0.5">
              <dt className="text-xs font-medium text-zinc-500">Data</dt>
              <dd className="text-zinc-200">{formatPostDate(dateStr)}</dd>
            </div>
          </dl>

          {/* Legenda */}
          {post.legenda && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500">Legenda</span>
              <p className="max-h-40 overflow-y-auto rounded-lg bg-zinc-800/60 p-3 text-sm leading-relaxed text-zinc-300">
                {post.legenda}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CalendarioPage() {
  const today = useMemo(() => new Date(), [])
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(today)
  )
  const [activePlatforms, setActivePlatforms] = useState<Set<Platform>>(
    new Set(PLATFORMS)
  )
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [posts] = useSupabaseState<Post[]>('/api/posts', 'content-dashboard:posts', mockPosts)

  // Build calendar days (full weeks covering the month)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [currentMonth])

  // Filter posts: must have a date, and plataforma must be active
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const hasDate = Boolean(post.dataAgendamento ?? post.dataPublicacao)
      return hasDate && activePlatforms.has(post.plataforma)
    })
  }, [posts, activePlatforms])

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

  function handleChipClick(post: Post) {
    setSelectedPost(post)
    setDialogOpen(true)
  }

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: ptBR })
  // Capitalise first letter
  const monthLabelFormatted =
    monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Calendário de Conteúdo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize e planeje posts em todas as plataformas.
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700"
            aria-label="Mês anterior"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-zinc-100">
            {monthLabelFormatted}
          </span>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700"
            aria-label="Próximo mês"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>

      {/* Platform filters */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((platform) => (
          <PlatformFilterButton
            key={platform}
            platform={platform}
            active={activePlatforms.has(platform)}
            onToggle={() => togglePlatform(platform)}
          />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/80">
          {DAY_HEADERS.map((day) => (
            <div
              key={day}
              className="border-r border-zinc-800 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            // Remove right border on last column, remove bottom border on last row
            const isLastCol = (idx + 1) % 7 === 0
            const isLastRow = idx >= calendarDays.length - 7

            return (
              <div
                key={day.toISOString()}
                className={[
                  isLastCol ? 'border-r-0' : '',
                  isLastRow ? '[&]:border-b-0' : '',
                ].join(' ')}
              >
                <DayCell
                  day={day}
                  currentMonth={currentMonth}
                  today={today}
                  posts={filteredPosts}
                  onChipClick={handleChipClick}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Post detail dialog */}
      <PostDetailDialog
        post={selectedPost}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
