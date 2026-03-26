import { Platform } from './types'

export const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
}

export const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  rascunho: 'Rascunho',
  agendado: 'Agendado',
  publicado: 'Publicado',
}

export const POST_TYPE_LABELS: Record<string, string> = {
  feed: 'Feed',
  carrossel: 'Carrossel',
  reels: 'Reels',
  stories: 'Stories',
  video: 'Vídeo',
  artigo: 'Artigo',
}

export const NEWS_THEME_LABELS: Record<string, string> = {
  ferramentas: 'Ferramentas',
  pesquisa: 'Pesquisa',
  negocios: 'Negócios',
  regulacao: 'Regulação',
  'mercado-livre': 'Mercado Livre',
}
