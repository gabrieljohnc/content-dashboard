import { supabase, type PostRow, type IdeaRow, type AnalyticsNoteRow, type CompetitorNoteRow, type NoticiaOverrideRow } from './supabase'

function db() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
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
