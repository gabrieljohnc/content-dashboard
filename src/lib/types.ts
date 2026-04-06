export type Platform = 'instagram' | 'linkedin' | 'youtube'

export type PostStatus = 'backlog' | 'aprovacao' | 'aprovado' | 'agendado' | 'postado'

export type PostType = 'feed' | 'carrossel' | 'reels' | 'stories' | 'video' | 'artigo'

export interface Post {
  id: string
  titulo: string
  legenda: string
  tipo: PostType
  plataforma: Platform
  status: PostStatus
  responsavel: string
  linkCanva?: string
  dataAgendamento?: string
  dataPublicacao?: string
  criadoEm: string
  atualizadoEm: string
}

export interface MetricData {
  data: string
  impressoes: number
  engajamento: number
  seguidores: number
  plataforma: Platform
}

export interface TopPost {
  id: string
  titulo: string
  plataforma: Platform
  impressoes: number
  curtidas: number
  comentarios: number
  compartilhamentos: number
  dataPublicacao: string
}

export interface Competitor {
  id: string
  nome: string
  perfis: {
    instagram?: string
    linkedin?: string
    youtube?: string
  }
  seguidores: Record<Platform, number>
  engajamento: Record<Platform, number>
  frequenciaPostagem: Record<Platform, number> // posts per week
  crescimento: Record<Platform, number> // percentage
  postsRecentes: CompetitorPost[]
}

export interface CompetitorPost {
  id: string
  plataforma: Platform
  conteudo: string
  curtidas: number
  comentarios: number
  dataPublicacao: string
}

export interface AnalysisNote {
  id: string
  plataforma: Platform
  texto: string
  criadoEm: string
}

export interface NewsItem {
  id: string
  titulo: string
  fonte: string
  url: string
  dataPublicacao: string
  resumo: string
  tema: 'ferramentas' | 'pesquisa' | 'negocios' | 'regulacao' | 'mercado-livre'
  plataformasRelevantes: Platform[]
}

// ---------------------------------------------------------------------------
// PLATFORM-SPECIFIC METRICS
// ---------------------------------------------------------------------------

export interface InstagramMetrics {
  data: string
  alcance: number
  salvamentos: number
  compartilhamentos: number
  watchTime: number // hours
  cliquesLink: number
  interacoesDirect: number
  comentarios: number
  seguidores: number
}

export interface LinkedInMetrics {
  data: string
  impressoes: number
  comentarios: number
  salvamentos: number
  dwellTime: number // seconds
  novosSeguidores: number
  compartilhamentos: number
  seguidores: number
}

export interface YouTubeMetrics {
  data: string
  ctrThumbnail: number // percentage
  retencaoMedia: number // percentage
  watchTime: number // hours
  engajamento: number // percentage (likes + comments / views)
  visualizacoes: number
  curtidas: number
  comentarios: number
  inscritos: number
}

// ---------------------------------------------------------------------------
// PLATFORM-SPECIFIC TOP POSTS
// ---------------------------------------------------------------------------

export interface TopPostInstagram {
  id: string
  titulo: string
  tipo: PostType
  alcance: number
  salvamentos: number
  compartilhamentos: number
  interacoesDirect: number
  comentarios: number
  watchTime?: number
  dataPublicacao: string
}

export interface TopPostLinkedIn {
  id: string
  titulo: string
  impressoes: number
  comentarios: number
  salvamentos: number
  dwellTime: number
  compartilhamentos: number
  dataPublicacao: string
}

export interface TopPostYouTube {
  id: string
  titulo: string
  visualizacoes: number
  ctrThumbnail: number
  retencaoMedia: number
  watchTime: number
  engajamento: number
  curtidas: number
  comentarios: number
  dataPublicacao: string
}
