'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircleIcon, XCircleIcon, LinkIcon, CopyIcon, CheckIcon, ImageIcon, ExternalLinkIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Idea, IdeaStatus, Post } from '@/lib/types'
import { mockPosts } from '@/lib/mock-data'

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchIdeas(): Promise<Idea[]> {
  try {
    const res = await fetch('/api/ideas')
    if (!res.ok) throw new Error('fetch failed')
    return await res.json()
  } catch {
    try { return JSON.parse(localStorage.getItem('content-dashboard:ideias') || '[]') } catch { return [] }
  }
}

async function saveIdea(idea: Idea): Promise<void> {
  fetch('/api/ideas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(idea) }).catch(() => {})
}

async function removeIdea(id: string): Promise<void> {
  fetch('/api/ideas', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {})
}

function addPostToBacklog(idea: Idea) {
  const now = new Date().toISOString()
  const newPost: Post = {
    id: crypto.randomUUID(),
    titulo: idea.descricao.split(/\s+/).slice(0, 3).join(' '),
    legenda: idea.descricao,
    tipo: 'feed',
    plataforma: 'instagram',
    status: 'backlog',
    responsavel: 'John',
    criadoEm: now,
    atualizadoEm: now,
  }
  fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newPost) }).catch(() => {})
}

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

const COLUMNS: { status: IdeaStatus; label: string; color: string }[] = [
  { status: 'ideia', label: 'Novas Ideias', color: '#eab308' },
  { status: 'aprovado', label: 'Aprovadas', color: '#22c55e' },
  { status: 'rejeitado', label: 'Rejeitadas', color: '#ef4444' },
]

// ---------------------------------------------------------------------------
// Image Preview
// ---------------------------------------------------------------------------

function ImagePreview({ src }: { src: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
        className="relative size-12 rounded-md overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-colors shrink-0"
      >
        <img src={src} alt="" className="size-full object-cover" />
      </button>
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-8" onClick={() => setExpanded(false)}>
          <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Idea Card
// ---------------------------------------------------------------------------

function IdeaCard({ idea, onUpdate, onDelete }: { idea: Idea; onUpdate: (idea: Idea) => void; onDelete: (id: string) => void }) {
  return (
    <Card size="sm" className="hover:ring-1 hover:ring-ring/50 transition-all">
      <CardHeader className="pb-0">
        <span className="text-[10px] text-muted-foreground/60">
          {new Date(idea.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{idea.descricao}</p>

        {idea.fontes && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <LinkIcon className="size-3 mt-0.5 shrink-0" />
            <span className="break-all">{idea.fontes}</span>
          </div>
        )}

        {idea.imagens && idea.imagens.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {idea.imagens.map((img, i) => (
              <ImagePreview key={i} src={img} />
            ))}
          </div>
        )}

        {idea.status === 'ideia' && (
          <div className="mt-1 flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              onClick={() => onUpdate({ ...idea, status: 'aprovado', atualizadoEm: new Date().toISOString() })}
            >
              <CheckCircleIcon className="size-3.5" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs"
              onClick={() => onUpdate({ ...idea, status: 'rejeitado', atualizadoEm: new Date().toISOString() })}
            >
              <XCircleIcon className="size-3.5" />
              Rejeitar
            </Button>
          </div>
        )}

        {idea.status !== 'ideia' && (
          <div className="mt-1 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs text-muted-foreground hover:text-red-400"
              onClick={() => onDelete(idea.id)}
            >
              <Trash2Icon className="size-3.5" />
              Remover
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function IdeiasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchIdeas().then((data) => { setIdeas(data); setMounted(true) })
  }, [])

  // Poll API for new ideas from the form
  useEffect(() => {
    const interval = setInterval(() => {
      fetchIdeas().then(setIdeas)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const formUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/ideias/formulario`
    : '/ideias/formulario'

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(formUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [formUrl])

  const handleUpdate = useCallback((updated: Idea) => {
    if (updated.status === 'aprovado') {
      addPostToBacklog(updated)
    }
    setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    saveIdea(updated)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id))
    removeIdea(id)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banco de Ideias</h1>
          <p className="text-sm text-muted-foreground">
            Receba sugestões de conteúdo dos seus colaboradores
          </p>
        </div>
      </div>

      {/* Shareable Link */}
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-sm font-medium text-zinc-300">Link do formulário para colaboradores</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 truncate font-mono">
            {formUrl}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={handleCopy}>
            {copied ? <CheckIcon className="size-3.5 text-emerald-400" /> : <CopyIcon className="size-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          <a href={formUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <ExternalLinkIcon className="size-3.5" />
              Abrir
            </Button>
          </a>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map(({ status, label, color }) => {
          const columnIdeas = ideas.filter((i) => i.status === status)
          return (
            <div key={status} className="flex flex-col gap-3">
              {/* Column header */}
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
                <h2 className="text-sm font-semibold">{label}</h2>
                <span className="ml-auto rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-muted-foreground">
                  {columnIdeas.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 min-h-[120px] rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-2">
                {columnIdeas.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center py-8">
                    {status === 'ideia' ? 'Nenhuma ideia nova' : 'Nenhuma ideia aqui'}
                  </p>
                )}
                {columnIdeas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
