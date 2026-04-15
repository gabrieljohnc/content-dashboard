import { Platform, PostFormat, PostObjective, PostAudience, PostCTA } from './types'

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
  aprovacao: 'Aprovação',
  producao: 'Produção',
  revisao: 'Revisão',
  agendado: 'Agendado',
  postado: 'Postado',
  analise: 'Análise',
  rejeitado: 'Rejeitado',
}

// Kept for analytics mock data (TopPostInstagram). Not used for the editable Post.
export const POST_TYPE_LABELS: Record<string, string> = {
  feed: 'Feed',
  carrossel: 'Carrossel',
  reels: 'Reels',
  stories: 'Stories',
  video: 'Vídeo',
  artigo: 'Artigo',
}

export const POST_FORMAT_LABELS: Record<PostFormat, string> = {
  carrossel: 'Carrossel',
  'post-estatico': 'Post estático',
  reels: 'Reels',
  stories: 'Stories',
}

export const POST_OBJECTIVE_LABELS: Record<PostObjective, string> = {
  'alcance-novo-publico': 'Alcance e novo público',
  'reconhecimento-marca': 'Reconhecimento de marca',
  'crescimento-base': 'Crescimento de base',
  'autoridade-setor': 'Autoridade no setor',
  engajamento: 'Engajamento',
}

export const POST_AUDIENCE_LABELS: Record<PostAudience, string> = {
  'eletricistas-autonomos': 'Eletricistas autônomos',
  'equipes-concessionarias': 'Equipes de concessionárias',
  'engenheiros-eletricistas': 'Engenheiros eletricistas',
  'supervisores-gestores': 'Supervisores e gestores',
}

export const POST_CTA_LABELS: Record<PostCTA, string> = {
  'salve-post': 'Salve este post',
  'compartilhe-equipe': 'Compartilhe com sua equipe',
  'siga-perfil': 'Siga o perfil',
  'marque-colega': 'Marque um colega',
  'link-bio': 'Acesse o link na bio',
  'contato-whatsapp': 'Entre em contato pelo WhatsApp',
}

export const NEWS_THEME_LABELS: Record<string, string> = {
  ferramentas: 'Ferramentas',
  pesquisa: 'Pesquisa',
  negocios: 'Negócios',
  regulacao: 'Regulação',
  'mercado-livre': 'Mercado Livre',
}
