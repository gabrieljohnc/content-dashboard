import { supabase, type PostRow, type IdeaRow, type AnalyticsNoteRow, type CompetitorNoteRow, type NoticiaOverrideRow } from './supabase'
import type { Post, PostFormat, PostObjective, PostAudience, PostCTA, Platform, PostStatus } from './types'

function db() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

// =========================================================================
// POSTS — Mapeamento camelCase (Post) ↔ snake_case (PostRow)
// =========================================================================

export function postToRow(post: Post): PostRow {
  return {
    id: post.id,
    titulo: post.titulo,
    legenda: post.legenda,
    formato: post.formato ?? null,
    plataforma: post.plataforma ?? null,
    status: post.status,
    objetivo: post.objetivo ?? null,
    publico: post.publico ?? null,
    mensagem_principal: post.mensagemPrincipal ?? null,
    cta: post.cta ?? null,
    tags: post.tags ?? [],
    data_agendamento: post.dataAgendamento ?? null,
    data_publicacao: post.dataPublicacao ?? null,
    criado_em: post.criadoEm,
    atualizado_em: post.atualizadoEm,
  }
}

export function rowToPost(row: PostRow): Post {
  return {
    id: row.id,
    titulo: row.titulo,
    legenda: row.legenda ?? '',
    formato: row.formato ? (row.formato as PostFormat) : undefined,
    plataforma: row.plataforma ? (row.plataforma as Platform) : undefined,
    status: row.status as PostStatus,
    objetivo: row.objetivo ? (row.objetivo as PostObjective) : undefined,
    publico: row.publico ? (row.publico as PostAudience) : undefined,
    mensagemPrincipal: row.mensagem_principal ?? undefined,
    cta: row.cta ? (row.cta as PostCTA) : undefined,
    tags: row.tags && row.tags.length > 0 ? row.tags : undefined,
    dataAgendamento: row.data_agendamento ?? undefined,
    dataPublicacao: row.data_publicacao ?? undefined,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  }
}

// =========================================================================
// POSTS
// =========================================================================

export async function getPosts(): Promise<PostRow[]> {
  const { data, error } = await db()
    .from('posts')
    .select('*')
    .order('atualizado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertPost(post: PostRow): Promise<void> {
  const { error } = await db()
    .from('posts')
    .upsert(post, { onConflict: 'id' })
  if (error) throw error
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await db().from('posts').delete().eq('id', id)
  if (error) throw error
}

export async function bulkUpsertPosts(posts: PostRow[]): Promise<void> {
  if (posts.length === 0) return
  const { error } = await db()
    .from('posts')
    .upsert(posts, { onConflict: 'id' })
  if (error) throw error
}

// =========================================================================
// IDEAS
// =========================================================================

export async function getIdeas(): Promise<IdeaRow[]> {
  const { data, error } = await db()
    .from('ideas')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertIdea(idea: IdeaRow): Promise<void> {
  const { error } = await db()
    .from('ideas')
    .upsert(idea, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteIdea(id: string): Promise<void> {
  const { error } = await db().from('ideas').delete().eq('id', id)
  if (error) throw error
}

// =========================================================================
// ANALYTICS NOTES
// =========================================================================

export async function getAnalyticsNotes(plataforma: string): Promise<AnalyticsNoteRow[]> {
  const { data, error } = await db()
    .from('analytics_notes')
    .select('*')
    .eq('plataforma', plataforma)
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAllAnalyticsNotes(): Promise<AnalyticsNoteRow[]> {
  const { data, error } = await db()
    .from('analytics_notes')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertAnalyticsNote(note: AnalyticsNoteRow): Promise<void> {
  const { error } = await db()
    .from('analytics_notes')
    .upsert(note, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteAnalyticsNote(id: string): Promise<void> {
  const { error } = await db().from('analytics_notes').delete().eq('id', id)
  if (error) throw error
}

// =========================================================================
// COMPETITOR NOTES
// =========================================================================

export async function getCompetitorNotes(): Promise<CompetitorNoteRow[]> {
  const { data, error } = await db()
    .from('competitor_notes')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function insertCompetitorNote(note: CompetitorNoteRow): Promise<void> {
  const { error } = await db().from('competitor_notes').insert(note)
  if (error) throw error
}

export async function deleteCompetitorNote(id: string): Promise<void> {
  const { error } = await db().from('competitor_notes').delete().eq('id', id)
  if (error) throw error
}

// =========================================================================
// NOTICIAS OVERRIDES
// =========================================================================

export async function getNoticiasOverrides(): Promise<NoticiaOverrideRow[]> {
  const { data, error } = await db()
    .from('noticias_overrides')
    .select('*')
  if (error) throw error
  return data ?? []
}

export async function upsertNoticiaOverride(noticiaId: number, decisao: string): Promise<void> {
  const { error } = await db()
    .from('noticias_overrides')
    .upsert({ noticia_id: noticiaId, decisao, criado_em: new Date().toISOString() }, { onConflict: 'noticia_id' })
  if (error) throw error
}

// =========================================================================
// NOTICIAS PROCESSADAS
// =========================================================================

export async function getNoticiasProcessadas(): Promise<number[]> {
  const { data, error } = await db()
    .from('noticias_processadas')
    .select('noticia_id')
  if (error) throw error
  return (data ?? []).map((r) => r.noticia_id)
}

export async function markNoticiasProcessadas(ids: number[]): Promise<void> {
  if (ids.length === 0) return
  const rows = ids.map((id) => ({ noticia_id: id, criado_em: new Date().toISOString() }))
  const { error } = await db()
    .from('noticias_processadas')
    .upsert(rows, { onConflict: 'noticia_id' })
  if (error) throw error
}
