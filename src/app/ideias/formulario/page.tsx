'use client'

import { useState, useRef } from 'react'
import { SendIcon, ImagePlusIcon, XIcon, LightbulbIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Idea } from '@/lib/types'

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

function submitIdea(idea: Idea) {
  fetch('/api/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(idea),
  }).catch(() => {
    // Fallback to localStorage if API unavailable
    try {
      const ideas = JSON.parse(localStorage.getItem('content-dashboard:ideias') || '[]')
      ideas.unshift(idea)
      localStorage.setItem('content-dashboard:ideias', JSON.stringify(ideas))
    } catch { /* ignore */ }
  })
}

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_IMAGES = 5

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ---------------------------------------------------------------------------
// Form Page
// ---------------------------------------------------------------------------

export default function FormularioIdeiasPage() {
  const [descricao, setDescricao] = useState('')
  const [fontes, setFontes] = useState('')
  const [imagens, setImagens] = useState<string[]>([])
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleAddImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setErro('')

    for (const file of files) {
      if (imagens.length >= MAX_IMAGES) {
        setErro(`Limite de ${MAX_IMAGES} imagens atingido.`)
        break
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setErro(`"${file.name}" excede 2MB. Escolha uma imagem menor.`)
        continue
      }
      const base64 = await fileToBase64(file)
      setImagens((prev) => [...prev, base64])
    }

    // reset input so user can select the same file again
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleRemoveImage(index: number) {
    setImagens((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) return

    const now = new Date().toISOString()
    const idea: Idea = {
      id: crypto.randomUUID(),
      descricao: descricao.trim(),
      fontes: fontes.trim() || undefined,
      imagens: imagens.length > 0 ? imagens : undefined,
      status: 'ideia',
      criadoEm: now,
      atualizadoEm: now,
    }

    submitIdea(idea)
    setEnviado(true)
  }

  function handleNova() {
    setDescricao('')
    setFontes('')
    setImagens([])
    setErro('')
    setEnviado(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-amber-500/10 mb-4">
            <LightbulbIcon className="size-7 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sugira uma Ideia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compartilhe sua ideia de conteúdo com a equipe de marketing
          </p>
        </div>

        {enviado ? (
          /* Success state */
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-500/15 mb-4">
              <SendIcon className="size-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-emerald-300">Ideia enviada!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sua sugestão foi recebida e será analisada pela equipe.
            </p>
            <Button onClick={handleNova} variant="outline" className="mt-6">
              Enviar outra ideia
            </Button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            {/* Descrição */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="descricao">
                Descreva sua ideia <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="descricao"
                placeholder="Qual é a sua ideia de conteúdo? Descreva o tema, formato, abordagem..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={5}
                className="resize-y"
                required
              />
            </div>

            {/* Fontes */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="fontes">Fontes <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                id="fontes"
                placeholder="Links, referências, artigos, perfis..."
                value={fontes}
                onChange={(e) => setFontes(e.target.value)}
              />
            </div>

            {/* Imagens */}
            <div className="flex flex-col gap-2">
              <Label>Imagens <span className="text-muted-foreground font-normal">(opcional, max {MAX_IMAGES})</span></Label>

              {imagens.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-1">
                  {imagens.map((img, i) => (
                    <div key={i} className="relative group">
                      <div className="size-20 rounded-lg overflow-hidden border border-zinc-700">
                        <img src={img} alt="" className="size-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imagens.length < MAX_IMAGES && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 w-fit"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlusIcon className="size-4" />
                  Adicionar imagem
                </Button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddImages}
              />

              {erro && <p className="text-xs text-red-400">{erro}</p>}
            </div>

            {/* Submit */}
            <Button type="submit" disabled={!descricao.trim()} className="gap-2 mt-2">
              <SendIcon className="size-4" />
              Enviar Ideia
            </Button>
          </form>
        )}

        <p className="text-center text-[11px] text-muted-foreground/40 mt-6">
          Central do Conteudo
        </p>
      </div>
    </div>
  )
}
