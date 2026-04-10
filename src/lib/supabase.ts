import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Server-side client (API routes only — never expose service_role key)
// Returns null if env vars are missing (local dev without Supabase)
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

// ---------------------------------------------------------------------------
// Table Row Types
// ---------------------------------------------------------------------------

export interface DailyMetricRow {
  id?: number
  project_id: number
  platform: 'Instagram' | 'LinkedIn' | 'YouTube'
  date: string // YYYY-MM-DD
  metrics: Record<string, number>
  integration_id?: number
  synced_at?: string
}

export interface PostRow {
  id: string
  titulo: string
  legenda: string
  tipo: string
  plataforma: string
  status: string
  responsavel: string
  tags: string[]
  link_canva: string | null
  data_agendamento: string | null
  data_publicacao: string | null
  criado_em: string
  atualizado_em: string
}

export interface IdeaRow {
  id: string
  descricao: string
  fontes: string | null
  imagens: string[]
  status: string
  criado_em: string
  atualizado_em: string
}

export interface AnalyticsNoteRow {
  id: string
  plataforma: string
  periodo_analise_start: string | null
  periodo_analise_end: string | null
  periodo_comparacao_start: string | null
  periodo_comparacao_end: string | null
  certo: string
  errado: string
  insight: string
  proxima_acao: string
  criado_em: string
}

export interface CompetitorNoteRow {
  id: string
  plataforma: string
  texto: string
  criado_em: string
}

export interface NoticiaOverrideRow {
  noticia_id: number
  decisao: string
  criado_em: string
}

export interface NoticiaProcessadaRow {
  noticia_id: number
  criado_em: string
}
