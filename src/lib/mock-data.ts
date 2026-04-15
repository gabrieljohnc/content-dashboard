import {
  Post,
  MetricData,
  TopPost,
  Competitor,
  NewsItem,
  InstagramMetrics,
  LinkedInMetrics,
  YouTubeMetrics,
  TopPostInstagram,
  TopPostLinkedIn,
  TopPostYouTube,
} from './types'

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — deterministic across server & client
// ---------------------------------------------------------------------------

function createSeededRandom(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const seeded = createSeededRandom(42)

// ---------------------------------------------------------------------------
// POSTS
// ---------------------------------------------------------------------------

export const mockPosts: Post[] = [
  {
    id: 'post-001',
    titulo: 'Como a modernização da rede elétrica reduz apagões',
    legenda:
      'A modernização da infraestrutura elétrica é essencial para garantir estabilidade e qualidade no fornecimento de energia. Investimentos em automação e sensores inteligentes permitem identificar falhas em tempo real e reduzir significativamente o tempo de interrupção. ⚡ Saiba mais nos comentários.',
    formato: 'post-estatico',
    plataforma: 'instagram',
    status: 'postado',
    dataPublicacao: '2026-04-06T10:00:00Z',
    criadoEm: '2026-04-06T08:00:00Z',
    atualizadoEm: '2026-04-06T10:00:00Z',
  },
  {
    id: 'post-002',
    titulo: 'Tarifas de energia em 2026: o que muda para o consumidor',
    legenda:
      'A ANEEL revisou as tarifas de distribuição para 2026, trazendo reajustes que impactam diretamente residências e empresas. Entenda os componentes que formam a sua conta de luz e como se preparar para as mudanças. Acesse o link na bio para o artigo completo.',
    formato: 'carrossel',
    plataforma: 'linkedin',
    status: 'postado',
    dataPublicacao: '2026-04-07T09:00:00Z',
    criadoEm: '2026-04-06T14:00:00Z',
    atualizadoEm: '2026-04-07T09:00:00Z',
  },
  {
    id: 'post-003',
    titulo: 'Redes inteligentes: o futuro da distribuição de energia no Brasil',
    legenda:
      'As smart grids chegaram para revolucionar a forma como distribuímos energia elétrica no Brasil. Com medição inteligente, automação de subestações e integração de fontes renováveis, a concessionária do futuro já é uma realidade. Neste vídeo exploramos os principais projetos em andamento.',
    plataforma: 'youtube',
    status: 'postado',
    dataPublicacao: '2026-04-08T15:00:00Z',
    criadoEm: '2026-04-06T10:00:00Z',
    atualizadoEm: '2026-04-08T15:00:00Z',
  },
  {
    id: 'post-004',
    titulo: 'DEC e FEC: entenda os indicadores de qualidade da sua distribuidora',
    legenda:
      'DEC (Duração Equivalente de Interrupção por Unidade Consumidora) e FEC (Frequência Equivalente de Interrupção) são os principais indicadores regulatórios de qualidade no setor elétrico. Entenda como eles funcionam e por que impactam diretamente a tarifa que você paga.',
    plataforma: 'linkedin',
    status: 'postado',
    dataPublicacao: '2026-04-09T11:00:00Z',
    criadoEm: '2026-04-07T09:00:00Z',
    atualizadoEm: '2026-04-09T11:00:00Z',
  },
  {
    id: 'post-005',
    titulo: 'Geração distribuída bate recorde no Brasil em 2025',
    legenda:
      'O Brasil encerrou 2025 com mais de 4 milhões de unidades consumidoras com geração distribuída conectadas à rede. A energia solar fotovoltaica lidera esse movimento e desafia as distribuidoras a modernizar sua infraestrutura. Confira os números e o que esperar para 2026.',
    formato: 'reels',
    plataforma: 'instagram',
    status: 'agendado',
    dataAgendamento: '2026-04-14T12:00:00Z',
    criadoEm: '2026-04-08T10:00:00Z',
    atualizadoEm: '2026-04-10T16:00:00Z',
  },
  {
    id: 'post-006',
    titulo: 'Perdas técnicas e comerciais: desafio histórico das distribuidoras',
    legenda:
      'As perdas de energia — técnicas e comerciais — representam um dos maiores desafios do setor de distribuição elétrica no Brasil. Algumas regiões registram perdas acima de 20%. Quais são as soluções tecnológicas e regulatórias para enfrentar esse problema?',
    plataforma: 'linkedin',
    status: 'agendado',
    dataAgendamento: '2026-04-15T09:00:00Z',
    criadoEm: '2026-04-09T14:00:00Z',
    atualizadoEm: '2026-04-11T11:00:00Z',
  },
  {
    id: 'post-007',
    titulo: 'Bastidores: como funciona uma subestação elétrica',
    legenda:
      'Já se perguntou o que acontece dentro de uma subestação elétrica antes de a energia chegar à sua casa? Neste vídeo mostramos o processo de transformação e distribuição de alta tensão com imagens exclusivas de campo.',
    plataforma: 'youtube',
    status: 'aprovacao',
    criadoEm: '2026-04-10T09:00:00Z',
    atualizadoEm: '2026-04-12T08:00:00Z',
  },
  {
    id: 'post-008',
    titulo: 'Crise hídrica e termelétricas: impacto na sua conta de luz',
    legenda:
      'Quando os reservatórios caem abaixo do nível crítico, o acionamento de termelétricas eleva o custo da energia e ativa bandeiras tarifárias. Entenda essa relação e como a diversificação da matriz elétrica protege o consumidor.',
    formato: 'carrossel',
    plataforma: 'instagram',
    status: 'producao',
    criadoEm: '2026-04-11T15:00:00Z',
    atualizadoEm: '2026-04-13T09:00:00Z',
  },
  {
    id: 'post-009',
    titulo: 'ESG no setor elétrico: metas e compromissos das distribuidoras',
    legenda:
      'As grandes distribuidoras de energia elétrica do Brasil vêm ampliando seus compromissos ESG com metas de redução de emissões, programas de eficiência energética e inclusão social. Saiba o que as principais concessionárias estão fazendo.',
    plataforma: 'linkedin',
    status: 'revisao',
    criadoEm: '2026-04-12T10:00:00Z',
    atualizadoEm: '2026-04-14T14:00:00Z',
  },
  {
    id: 'post-010',
    titulo: 'Eficiência energética residencial: 5 dicas para reduzir sua conta',
    legenda:
      'Pequenas mudanças de hábito e escolhas inteligentes de equipamentos podem reduzir o consumo de energia elétrica em até 30%. Confira as dicas que separamos para você economizar sem abrir mão do conforto.',
    formato: 'stories',
    plataforma: 'instagram',
    status: 'analise',
    dataPublicacao: '2026-04-05T14:00:00Z',
    criadoEm: '2026-04-01T11:00:00Z',
    atualizadoEm: '2026-04-08T11:00:00Z',
  },
  {
    id: 'post-011',
    titulo: 'Revisão tarifária periódica: o que é e como afeta as distribuidoras',
    legenda:
      'A revisão tarifária periódica (RTP) é o processo pelo qual a ANEEL redefine a tarifa das distribuidoras a cada ciclo regulatório. Entenda como funciona o cálculo da receita requerida e qual o impacto para investimentos no setor.',
    status: 'backlog',
    objetivo: 'autoridade-setor',
    publico: 'engenheiros-eletricistas',
    mensagemPrincipal: 'Entender a RTP é entender o ritmo de investimento do setor.',
    cta: 'compartilhe-equipe',
    plataforma: 'linkedin',
    criadoEm: '2026-04-16T08:00:00Z',
    atualizadoEm: '2026-04-16T08:00:00Z',
  },
  {
    id: 'post-013',
    titulo: 'Geração distribuída cresce 22% no 1º trimestre de 2026',
    legenda:
      'Ideia vinda do RSS: dados recentes da ABSOLAR mostram aceleração da adoção residencial — bom gancho para um post educativo sobre impacto na rede de distribuição.',
    status: 'backlog',
    criadoEm: '2026-04-15T10:30:00Z',
    atualizadoEm: '2026-04-15T10:30:00Z',
  },
  {
    id: 'post-012',
    titulo: 'Veículos elétricos e a rede de distribuição: estamos preparados?',
    legenda:
      'A chegada massiva de veículos elétricos ao Brasil nos próximos anos vai exigir uma profunda adaptação da rede de distribuição. Carregamento simultâneo em horários de pico pode sobrecarregar transformadores e alimentadores. Quais são as soluções técnicas disponíveis?',
    plataforma: 'youtube',
    status: 'rejeitado',
    criadoEm: '2026-04-17T09:00:00Z',
    atualizadoEm: '2026-04-17T09:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// METRIC DATA — 90 days (Dec 19, 2025 → Mar 19, 2026)
// ---------------------------------------------------------------------------

function generateMetrics(): MetricData[] {
  const metrics: MetricData[] = []
  const startDate = new Date('2025-12-19')

  // Baseline configs per platform
  const config = {
    instagram: {
      baseImpressions: 18000,
      baseEngagement: 820,
      baseFollowers: 14200,
      impressionVariance: 6000,
      engagementVariance: 300,
      followerGrowthPerDay: 18,
      trend: 1.008,
    },
    linkedin: {
      baseImpressions: 24000,
      baseEngagement: 1850,
      baseFollowers: 22500,
      impressionVariance: 7000,
      engagementVariance: 500,
      followerGrowthPerDay: 35,
      trend: 1.010,
    },
    youtube: {
      baseImpressions: 9000,
      baseEngagement: 320,
      baseFollowers: 7800,
      impressionVariance: 4000,
      engagementVariance: 120,
      followerGrowthPerDay: 22,
      trend: 1.015,
    },
  }

  const platforms = ['instagram', 'linkedin', 'youtube'] as const

  for (let day = 0; day < 90; day++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.72 : 1.0

    for (const platform of platforms) {
      const cfg = config[platform]
      const growthFactor = Math.pow(cfg.trend, day)
      const noise = () => (seeded() - 0.5) * 2

      const impressoes = Math.round(
        (cfg.baseImpressions + noise() * cfg.impressionVariance) * growthFactor * weekendFactor
      )
      const engajamento = Math.round(
        (cfg.baseEngagement + noise() * cfg.engagementVariance) * growthFactor * weekendFactor
      )
      const seguidores = Math.round(cfg.baseFollowers + cfg.followerGrowthPerDay * day + noise() * 30)

      metrics.push({
        data: dateStr,
        impressoes: Math.max(impressoes, 1000),
        engajamento: Math.max(engajamento, 50),
        seguidores: Math.max(seguidores, 0),
        plataforma: platform,
      })
    }
  }

  return metrics
}

export const mockMetrics: MetricData[] = generateMetrics()

// ---------------------------------------------------------------------------
// TOP POSTS
// ---------------------------------------------------------------------------

export const mockTopPosts: TopPost[] = [
  {
    id: 'top-001',
    titulo: 'Apagão de dezembro: o que aconteceu e o que aprendemos',
    plataforma: 'instagram',
    impressoes: 87400,
    curtidas: 3210,
    comentarios: 412,
    compartilhamentos: 876,
    dataPublicacao: '2025-12-22T10:00:00Z',
  },
  {
    id: 'top-002',
    titulo: 'Revisão tarifária 2026: impacto real na conta de luz',
    plataforma: 'linkedin',
    impressoes: 112300,
    curtidas: 4870,
    comentarios: 634,
    compartilhamentos: 1240,
    dataPublicacao: '2026-01-15T09:00:00Z',
  },
  {
    id: 'top-003',
    titulo: 'Como a inteligência artificial está otimizando a rede elétrica',
    plataforma: 'youtube',
    impressoes: 54200,
    curtidas: 1890,
    comentarios: 287,
    compartilhamentos: 412,
    dataPublicacao: '2026-01-28T15:00:00Z',
  },
  {
    id: 'top-004',
    titulo: 'Geração solar distribuída: 4 milhões de unidades e crescendo',
    plataforma: 'instagram',
    impressoes: 74600,
    curtidas: 2980,
    comentarios: 318,
    compartilhamentos: 724,
    dataPublicacao: '2026-02-05T12:00:00Z',
  },
  {
    id: 'top-005',
    titulo: 'ESG e o setor elétrico: metas das distribuidoras para 2030',
    plataforma: 'linkedin',
    impressoes: 98700,
    curtidas: 4120,
    comentarios: 578,
    compartilhamentos: 1087,
    dataPublicacao: '2026-02-12T09:00:00Z',
  },
  {
    id: 'top-006',
    titulo: 'Veículos elétricos: a rede de distribuição está pronta?',
    plataforma: 'youtube',
    impressoes: 61800,
    curtidas: 2340,
    comentarios: 398,
    compartilhamentos: 531,
    dataPublicacao: '2026-02-20T15:00:00Z',
  },
  {
    id: 'top-007',
    titulo: 'Bandeiras tarifárias: guia completo para entender sua conta',
    plataforma: 'instagram',
    impressoes: 69300,
    curtidas: 2670,
    comentarios: 289,
    compartilhamentos: 643,
    dataPublicacao: '2026-03-01T11:00:00Z',
  },
  {
    id: 'top-008',
    titulo: 'DEC e FEC: as métricas que as distribuidoras precisam dominar',
    plataforma: 'linkedin',
    impressoes: 88500,
    curtidas: 3760,
    comentarios: 492,
    compartilhamentos: 930,
    dataPublicacao: '2026-03-08T09:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// COMPETITORS
// ---------------------------------------------------------------------------

export const mockCompetitors: Competitor[] = [
  {
    id: 'comp-001',
    nome: 'CPFL Energia',
    perfis: {
      instagram: '@cpflenergia',
      linkedin: 'cpfl-energia',
      youtube: 'CPFLEnergia',
    },
    seguidores: {
      instagram: 98400,
      linkedin: 187200,
      youtube: 43600,
    },
    engajamento: {
      instagram: 2.4,
      linkedin: 3.8,
      youtube: 1.9,
    },
    frequenciaPostagem: {
      instagram: 5,
      linkedin: 4,
      youtube: 1,
    },
    crescimento: {
      instagram: 1.8,
      linkedin: 2.6,
      youtube: 3.2,
    },
    postsRecentes: [
      {
        id: 'cp-post-001',
        plataforma: 'linkedin',
        conteudo:
          'A CPFL Energia investiu R$ 2,4 bilhões em expansão e modernização da rede em 2025, beneficiando mais de 9 milhões de clientes no estado de São Paulo. Confira nosso relatório anual de sustentabilidade.',
        curtidas: 1840,
        comentarios: 212,
        dataPublicacao: '2026-03-10T09:00:00Z',
      },
      {
        id: 'cp-post-002',
        plataforma: 'instagram',
        conteudo:
          'Você sabia que nossas equipes de emergência atendem chamados em menos de 4 horas em média? Estamos comprometidos com a qualidade do seu fornecimento de energia. ⚡',
        curtidas: 1230,
        comentarios: 87,
        dataPublicacao: '2026-03-12T11:00:00Z',
      },
      {
        id: 'cp-post-003',
        plataforma: 'youtube',
        conteudo:
          'Conheça nosso centro de operações em tempo real: como monitoramos toda a rede elétrica do interior paulista com tecnologia de ponta.',
        curtidas: 780,
        comentarios: 94,
        dataPublicacao: '2026-03-07T15:00:00Z',
      },
    ],
  },
  {
    id: 'comp-002',
    nome: 'Enel Brasil',
    perfis: {
      instagram: '@enelbrasil',
      linkedin: 'enel-brasil',
      youtube: 'EnelBrasil',
    },
    seguidores: {
      instagram: 134700,
      linkedin: 214600,
      youtube: 58900,
    },
    engajamento: {
      instagram: 2.1,
      linkedin: 3.5,
      youtube: 1.6,
    },
    frequenciaPostagem: {
      instagram: 6,
      linkedin: 5,
      youtube: 2,
    },
    crescimento: {
      instagram: 1.4,
      linkedin: 2.1,
      youtube: 2.7,
    },
    postsRecentes: [
      {
        id: 'en-post-001',
        plataforma: 'linkedin',
        conteudo:
          'A Enel Brasil anuncia a instalação de 1,2 milhão de medidores inteligentes no Rio de Janeiro até o final de 2026, marcando um passo decisivo rumo à rede elétrica do futuro.',
        curtidas: 2340,
        comentarios: 318,
        dataPublicacao: '2026-03-11T10:00:00Z',
      },
      {
        id: 'en-post-002',
        plataforma: 'instagram',
        conteudo:
          'Energia limpa para todos! Nossa campanha de eficiência energética já alcançou 500 mil famílias em comunidades vulneráveis do Ceará e de Goiás. Juntos somos mais fortes! 💚',
        curtidas: 2870,
        comentarios: 203,
        dataPublicacao: '2026-03-14T12:00:00Z',
      },
      {
        id: 'en-post-003',
        plataforma: 'youtube',
        conteudo:
          'Documentário: A transformação digital da distribuição de energia elétrica no Brasil — casos reais da Enel Distribuição Rio, São Paulo e Goiás.',
        curtidas: 1120,
        comentarios: 147,
        dataPublicacao: '2026-03-06T16:00:00Z',
      },
    ],
  },
  {
    id: 'comp-003',
    nome: 'Neoenergia',
    perfis: {
      instagram: '@neoenergia',
      linkedin: 'neoenergia',
      youtube: 'Neoenergia',
    },
    seguidores: {
      instagram: 86300,
      linkedin: 162400,
      youtube: 31200,
    },
    engajamento: {
      instagram: 2.7,
      linkedin: 4.1,
      youtube: 2.2,
    },
    frequenciaPostagem: {
      instagram: 4,
      linkedin: 4,
      youtube: 1,
    },
    crescimento: {
      instagram: 2.3,
      linkedin: 3.4,
      youtube: 4.1,
    },
    postsRecentes: [
      {
        id: 'ne-post-001',
        plataforma: 'linkedin',
        conteudo:
          'A Neoenergia foi reconhecida como uma das empresas mais inovadoras do setor elétrico pelo 3º ano consecutivo. Nossa aposta em tecnologia e pessoas faz a diferença para 19 milhões de clientes no Brasil.',
        curtidas: 3120,
        comentarios: 427,
        dataPublicacao: '2026-03-13T09:00:00Z',
      },
      {
        id: 'ne-post-002',
        plataforma: 'instagram',
        conteudo:
          'Tem dúvidas sobre a sua fatura? Nossa equipe de atendimento digital responde em menos de 2 horas pelo app Neoenergia. Baixe agora e simplifique sua vida! 📱⚡',
        curtidas: 1640,
        comentarios: 134,
        dataPublicacao: '2026-03-15T13:00:00Z',
      },
      {
        id: 'ne-post-003',
        plataforma: 'youtube',
        conteudo:
          'Como a Neoenergia está integrando energia eólica e solar à rede de distribuição no Nordeste — desafios técnicos e soluções inovadoras.',
        curtidas: 920,
        comentarios: 118,
        dataPublicacao: '2026-03-09T15:00:00Z',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// NEWS
// ---------------------------------------------------------------------------

export const mockNews: NewsItem[] = [
  {
    id: 'news-001',
    titulo: 'ANEEL aprova reajuste médio de 6,8% nas tarifas de distribuição para 2026',
    fonte: 'Agência Nacional de Energia Elétrica',
    url: 'https://www.aneel.gov.br/noticias/reajuste-tarifas-2026',
    dataPublicacao: '2026-03-15T10:00:00Z',
    resumo:
      'A Agência Nacional de Energia Elétrica (ANEEL) homologou o reajuste médio de 6,8% nas tarifas de distribuição de energia elétrica para o ciclo 2026, com variações entre distribuidoras conforme desempenho operacional e custos regulatórios.',
    tema: 'regulacao',
    plataformasRelevantes: ['linkedin', 'instagram'],
  },
  {
    id: 'news-002',
    titulo: 'Brasil atinge 4,5 milhões de unidades com geração distribuída solar',
    fonte: 'ABSOLAR',
    url: 'https://www.absolar.org.br/noticias/geracao-distribuida-4-5-milhoes',
    dataPublicacao: '2026-03-12T09:00:00Z',
    resumo:
      'A Associação Brasileira de Energia Solar Fotovoltaica (ABSOLAR) divulgou que o Brasil atingiu a marca de 4,5 milhões de unidades consumidoras com geração distribuída solar, consolidando o país como referência mundial na adoção de energia limpa residencial.',
    tema: 'mercado-livre',
    plataformasRelevantes: ['instagram', 'linkedin', 'youtube'],
  },
  {
    id: 'news-003',
    titulo: 'Neoenergia implementa sistema de IA para previsão de falhas na rede',
    fonte: 'Canal Energia',
    url: 'https://www.canalenergia.com.br/noticias/neoenergia-ia-previsao-falhas',
    dataPublicacao: '2026-03-10T11:00:00Z',
    resumo:
      'A Neoenergia anunciou a implantação de um sistema de inteligência artificial capaz de prever falhas na rede elétrica com até 72 horas de antecedência, reduzindo em 35% o número de interrupções não programadas em sua área de concessão no Nordeste.',
    tema: 'ferramentas',
    plataformasRelevantes: ['linkedin', 'youtube'],
  },
  {
    id: 'news-004',
    titulo: 'Pesquisa revela que 68% dos brasileiros não entendem sua conta de luz',
    fonte: 'FGV Energia',
    url: 'https://fgvenergia.fgv.br/pesquisas/conta-de-luz-2026',
    dataPublicacao: '2026-03-08T14:00:00Z',
    resumo:
      'Levantamento inédito da FGV Energia aponta que 68% dos consumidores residenciais brasileiros não conseguem interpretar corretamente os componentes da fatura de energia elétrica, evidenciando a necessidade de maior transparência e educação tarifária por parte das distribuidoras.',
    tema: 'pesquisa',
    plataformasRelevantes: ['instagram', 'linkedin'],
  },
  {
    id: 'news-005',
    titulo: 'Governo Federal lança programa de modernização de redes com R$ 8 bilhões',
    fonte: 'Ministério de Minas e Energia',
    url: 'https://www.gov.br/mme/noticias/programa-modernizacao-redes-2026',
    dataPublicacao: '2026-03-05T09:00:00Z',
    resumo:
      'O Ministério de Minas e Energia lançou o Programa Nacional de Modernização das Redes de Distribuição, com investimentos previstos de R$ 8 bilhões para o período 2026-2030, focados em automação, medição inteligente e integração de fontes renováveis.',
    tema: 'negocios',
    plataformasRelevantes: ['linkedin', 'youtube', 'instagram'],
  },
  {
    id: 'news-006',
    titulo: 'Regulação de veículos elétricos: ANEEL abre consulta pública sobre tarifas de recarga',
    fonte: 'ANEEL',
    url: 'https://www.aneel.gov.br/consultas-publicas/tarifas-recarga-ve',
    dataPublicacao: '2026-03-03T10:00:00Z',
    resumo:
      'A ANEEL abriu consulta pública para definir o marco regulatório das tarifas de recarga de veículos elétricos conectados à rede de distribuição, um passo fundamental para a expansão da mobilidade elétrica no Brasil sem sobrecarga às concessionárias.',
    tema: 'regulacao',
    plataformasRelevantes: ['linkedin', 'youtube'],
  },
  {
    id: 'news-007',
    titulo: 'Startup brasileira desenvolve transformador inteligente com monitoramento em tempo real',
    fonte: 'MIT Technology Review Brasil',
    url: 'https://mittechreview.com.br/transformador-inteligente-startup',
    dataPublicacao: '2026-02-27T12:00:00Z',
    resumo:
      'Uma startup brasileira apresentou um transformador de distribuição com sensores IoT integrados capaz de enviar dados de temperatura, carga e qualidade de energia em tempo real para centros de controle, potencialmente reduzindo em 40% o tempo de diagnóstico de falhas.',
    tema: 'ferramentas',
    plataformasRelevantes: ['linkedin', 'youtube', 'instagram'],
  },
  {
    id: 'news-008',
    titulo: 'Perdas comerciais custam R$ 12 bilhões ao setor elétrico brasileiro em 2025',
    fonte: 'Instituto Acende Brasil',
    url: 'https://www.acendebrasil.com.br/estudos/perdas-comerciais-2025',
    dataPublicacao: '2026-02-20T10:00:00Z',
    resumo:
      'Relatório do Instituto Acende Brasil estima que as perdas comerciais de energia elétrica — incluindo furtos e fraudes — custaram R$ 12 bilhões ao setor em 2025, valor que é repassado às tarifas dos consumidores regulados e representa um dos maiores desafios do setor.',
    tema: 'pesquisa',
    plataformasRelevantes: ['linkedin', 'instagram'],
  },
  {
    id: 'news-009',
    titulo: 'CPFL e Comerc anunciam parceria para oferta de energia no mercado livre às PMEs',
    fonte: 'Valor Econômico',
    url: 'https://valor.globo.com/empresas/noticia/cpfl-comerc-parceria-mercado-livre-pme',
    dataPublicacao: '2026-02-14T09:00:00Z',
    resumo:
      'A CPFL Energia e a comercializadora Comerc firmaram parceria estratégica para ampliar o acesso de pequenas e médias empresas ao mercado livre de energia, aproveitando as mudanças regulatórias que reduziram o limite de migração para 500 kW a partir de 2024.',
    tema: 'mercado-livre',
    plataformasRelevantes: ['linkedin'],
  },
  {
    id: 'news-010',
    titulo: 'Estudo aponta que smart grids podem reduzir emissões do setor em 22% até 2030',
    fonte: 'EPE — Empresa de Pesquisa Energética',
    url: 'https://www.epe.gov.br/estudos/smart-grids-emissoes-2030',
    dataPublicacao: '2026-02-05T11:00:00Z',
    resumo:
      'A Empresa de Pesquisa Energética (EPE) publicou estudo indicando que a adoção plena de redes elétricas inteligentes (smart grids) no Brasil tem potencial de reduzir as emissões associadas ao setor de distribuição em 22% até 2030, combinando eficiência operacional e melhor integração de renováveis.',
    tema: 'pesquisa',
    plataformasRelevantes: ['linkedin', 'youtube', 'instagram'],
  },
]

// ---------------------------------------------------------------------------
// INSTAGRAM METRICS — 90 days (Dec 19, 2025 → Mar 19, 2026)
// ---------------------------------------------------------------------------

function generateInstagramMetrics(): InstagramMetrics[] {
  const metrics: InstagramMetrics[] = []
  const startDate = new Date('2025-12-19')

  for (let day = 0; day < 90; day++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0
    const growthFactor = Math.pow(1.008, day)
    const noise = () => (seeded() - 0.5) * 2

    const alcance = Math.round(
      (15000 + noise() * 5000) * growthFactor * weekendFactor
    )
    const salvamentos = Math.round(
      (180 + noise() * 60) * growthFactor
    )
    const compartilhamentos = Math.round(
      (95 + noise() * 35) * growthFactor
    )
    const watchTime = Math.round(
      (35 + noise() * 12) * growthFactor * weekendFactor * 10
    ) / 10
    const cliquesLink = Math.round(
      (120 + noise() * 45) * growthFactor * weekendFactor
    )
    const interacoesDirect = Math.round(
      (45 + noise() * 20) * growthFactor * weekendFactor
    )
    const comentarios = Math.round(
      (85 + noise() * 30) * growthFactor
    )
    const seguidores = Math.round(14200 + 18 * day + noise() * 20)

    metrics.push({
      data: dateStr,
      alcance: Math.max(alcance, 3000),
      salvamentos: Math.max(salvamentos, 20),
      compartilhamentos: Math.max(compartilhamentos, 10),
      watchTime: Math.max(watchTime, 5),
      cliquesLink: Math.max(cliquesLink, 10),
      interacoesDirect: Math.max(interacoesDirect, 5),
      comentarios: Math.max(comentarios, 10),
      seguidores: Math.max(seguidores, 14200),
    })
  }

  return metrics
}

export const mockInstagramMetrics: InstagramMetrics[] = generateInstagramMetrics()

// ---------------------------------------------------------------------------
// LINKEDIN METRICS — 90 days (Dec 19, 2025 → Mar 19, 2026)
// ---------------------------------------------------------------------------

function generateLinkedInMetrics(): LinkedInMetrics[] {
  const metrics: LinkedInMetrics[] = []
  const startDate = new Date('2025-12-19')

  for (let day = 0; day < 90; day++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    // LinkedIn is more weekday-driven — weekends drop more significantly
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.55 : 1.0
    const growthFactor = Math.pow(1.010, day)
    const noise = () => (seeded() - 0.5) * 2

    const impressoes = Math.round(
      (24000 + noise() * 7000) * growthFactor * weekendFactor
    )
    const comentarios = Math.round(
      (145 + noise() * 50) * growthFactor * weekendFactor
    )
    const salvamentos = Math.round(
      (180 + noise() * 60) * growthFactor * weekendFactor
    )
    const dwellTime = Math.min(120, Math.max(8, (42 + noise() * 15) * growthFactor))
    const novosSeguidores = Math.round(
      Math.max(0, 28 + noise() * 12)
    )
    const compartilhamentos = Math.round(
      (68 + noise() * 25) * growthFactor * weekendFactor
    )
    const seguidores = Math.round(22500 + 35 * day + noise() * 30)

    metrics.push({
      data: dateStr,
      impressoes: Math.max(impressoes, 4000),
      comentarios: Math.max(comentarios, 10),
      salvamentos: Math.max(salvamentos, 20),
      dwellTime: Math.round(dwellTime * 10) / 10,
      novosSeguidores: Math.max(novosSeguidores, 0),
      compartilhamentos: Math.max(compartilhamentos, 5),
      seguidores: Math.max(seguidores, 22500),
    })
  }

  return metrics
}

export const mockLinkedInMetrics: LinkedInMetrics[] = generateLinkedInMetrics()

// ---------------------------------------------------------------------------
// YOUTUBE METRICS — 90 days (Dec 19, 2025 → Mar 19, 2026)
// ---------------------------------------------------------------------------

function generateYouTubeMetrics(): YouTubeMetrics[] {
  const metrics: YouTubeMetrics[] = []
  const startDate = new Date('2025-12-19')

  for (let day = 0; day < 90; day++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]
    // YouTube watch patterns — weekends slightly higher for entertainment,
    // but this niche (energy distribution) is slightly flatter
    const dayOfWeek = date.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.88 : 1.0
    const growthFactor = Math.pow(1.015, day)
    const noise = () => (seeded() - 0.5) * 2

    const ctrThumbnail = Math.min(20, Math.max(1.5, 5.8 + noise() * 2.0))
    const retencaoMedia = Math.min(80, Math.max(15, 38 + noise() * 10))
    const watchTime = Math.round(
      (145 + noise() * 50) * growthFactor * weekendFactor
    )
    const engajamento = Math.min(15, Math.max(1.5, 5.2 + noise() * 2.5))
    const visualizacoes = Math.round(
      (3200 + noise() * 1200) * growthFactor * weekendFactor
    )
    const curtidas = Math.round(
      (180 + noise() * 60) * growthFactor * weekendFactor
    )
    const comentarios = Math.round(
      (42 + noise() * 18) * growthFactor
    )
    const inscritos = Math.round(7800 + 22 * day + noise() * 20)

    metrics.push({
      data: dateStr,
      ctrThumbnail: Math.round(ctrThumbnail * 10) / 10,
      retencaoMedia: Math.round(retencaoMedia * 10) / 10,
      watchTime: Math.max(watchTime, 20),
      engajamento: Math.round(engajamento * 10) / 10,
      visualizacoes: Math.max(visualizacoes, 400),
      curtidas: Math.max(curtidas, 20),
      comentarios: Math.max(comentarios, 5),
      inscritos: Math.max(inscritos, 7800),
    })
  }

  return metrics
}

export const mockYouTubeMetrics: YouTubeMetrics[] = generateYouTubeMetrics()

// ---------------------------------------------------------------------------
// TOP POSTS — INSTAGRAM
// ---------------------------------------------------------------------------

export const mockTopPostsInstagram: TopPostInstagram[] = [
  {
    id: 'ig-top-001',
    titulo: 'Apagão de dezembro: o que aconteceu',
    tipo: 'reels',
    alcance: 94200,
    salvamentos: 820,
    compartilhamentos: 1380,
    interacoesDirect: 142,
    comentarios: 512,
    watchTime: 58,
    dataPublicacao: '2025-12-22T10:00:00Z',
  },
  {
    id: 'ig-top-002',
    titulo: '5 dicas para reduzir sua conta de luz',
    tipo: 'carrossel',
    alcance: 78600,
    salvamentos: 1240,
    compartilhamentos: 940,
    interacoesDirect: 98,
    comentarios: 348,
    dataPublicacao: '2026-01-14T12:00:00Z',
  },
  {
    id: 'ig-top-003',
    titulo: 'Geração solar: 4 milhões e crescendo',
    tipo: 'feed',
    alcance: 61400,
    salvamentos: 680,
    compartilhamentos: 1120,
    interacoesDirect: 76,
    comentarios: 287,
    dataPublicacao: '2026-01-28T11:00:00Z',
  },
  {
    id: 'ig-top-004',
    titulo: 'Bandeiras tarifárias explicadas',
    tipo: 'reels',
    alcance: 72800,
    salvamentos: 890,
    compartilhamentos: 760,
    interacoesDirect: 118,
    comentarios: 423,
    watchTime: 52,
    dataPublicacao: '2026-02-10T10:00:00Z',
  },
  {
    id: 'ig-top-005',
    titulo: 'Crise hídrica e sua conta',
    tipo: 'carrossel',
    alcance: 58300,
    salvamentos: 1040,
    compartilhamentos: 680,
    interacoesDirect: 64,
    comentarios: 264,
    dataPublicacao: '2026-02-24T12:00:00Z',
  },
  {
    id: 'ig-top-006',
    titulo: 'Como funciona uma subestação',
    tipo: 'reels',
    alcance: 83500,
    salvamentos: 1160,
    compartilhamentos: 1240,
    interacoesDirect: 156,
    comentarios: 618,
    watchTime: 62,
    dataPublicacao: '2026-03-08T11:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// TOP POSTS — LINKEDIN
// ---------------------------------------------------------------------------

export const mockTopPostsLinkedIn: TopPostLinkedIn[] = [
  {
    id: 'li-top-001',
    titulo: 'Revisão tarifária 2026: análise completa',
    impressoes: 118400,
    comentarios: 634,
    salvamentos: 2430,
    dwellTime: 54.2,
    compartilhamentos: 1240,
    dataPublicacao: '2026-01-15T09:00:00Z',
  },
  {
    id: 'li-top-002',
    titulo: 'ESG no setor elétrico: metas 2030',
    impressoes: 104600,
    comentarios: 578,
    salvamentos: 2060,
    dwellTime: 47.8,
    compartilhamentos: 1087,
    dataPublicacao: '2026-02-12T09:00:00Z',
  },
  {
    id: 'li-top-003',
    titulo: 'DEC e FEC: indicadores regulatórios',
    impressoes: 92800,
    comentarios: 492,
    salvamentos: 1880,
    dwellTime: 61.3,
    compartilhamentos: 930,
    dataPublicacao: '2026-03-08T09:00:00Z',
  },
  {
    id: 'li-top-004',
    titulo: 'Perdas comerciais: R$ 12 bilhões',
    impressoes: 87300,
    comentarios: 546,
    salvamentos: 1645,
    dwellTime: 49.5,
    compartilhamentos: 874,
    dataPublicacao: '2026-02-20T10:00:00Z',
  },
  {
    id: 'li-top-005',
    titulo: 'Smart grids no Brasil: estado da arte',
    impressoes: 79400,
    comentarios: 418,
    salvamentos: 1490,
    dwellTime: 44.1,
    compartilhamentos: 1156,
    dataPublicacao: '2026-01-30T09:00:00Z',
  },
  {
    id: 'li-top-006',
    titulo: 'Mercado livre de energia para PMEs',
    impressoes: 95200,
    comentarios: 384,
    salvamentos: 1770,
    dwellTime: 58.7,
    compartilhamentos: 786,
    dataPublicacao: '2026-03-01T10:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// TOP POSTS — YOUTUBE
// ---------------------------------------------------------------------------

export const mockTopPostsYouTube: TopPostYouTube[] = [
  {
    id: 'yt-top-001',
    titulo: 'Bastidores de uma subestação',
    visualizacoes: 48600,
    ctrThumbnail: 8.4,
    retencaoMedia: 65,
    watchTime: 2840,
    engajamento: 5.3,
    curtidas: 2180,
    comentarios: 387,
    dataPublicacao: '2025-12-28T15:00:00Z',
  },
  {
    id: 'yt-top-002',
    titulo: 'IA na rede elétrica',
    visualizacoes: 54200,
    ctrThumbnail: 7.2,
    retencaoMedia: 52,
    watchTime: 2340,
    engajamento: 4.0,
    curtidas: 1890,
    comentarios: 287,
    dataPublicacao: '2026-01-28T15:00:00Z',
  },
  {
    id: 'yt-top-003',
    titulo: 'Veículos elétricos: a rede está pronta?',
    visualizacoes: 71800,
    ctrThumbnail: 9.1,
    retencaoMedia: 44,
    watchTime: 2610,
    engajamento: 4.4,
    curtidas: 2640,
    comentarios: 498,
    dataPublicacao: '2026-02-20T15:00:00Z',
  },
  {
    id: 'yt-top-004',
    titulo: 'Como funciona sua conta de luz',
    visualizacoes: 62400,
    ctrThumbnail: 7.8,
    retencaoMedia: 48,
    watchTime: 2480,
    engajamento: 4.3,
    curtidas: 2290,
    comentarios: 412,
    dataPublicacao: '2026-01-10T14:00:00Z',
  },
  {
    id: 'yt-top-005',
    titulo: 'Redes inteligentes: o futuro',
    visualizacoes: 43800,
    ctrThumbnail: 6.4,
    retencaoMedia: 46,
    watchTime: 2920,
    engajamento: 4.7,
    curtidas: 1740,
    comentarios: 318,
    dataPublicacao: '2026-03-05T15:00:00Z',
  },
  {
    id: 'yt-top-006',
    titulo: 'Energia solar: desafios na distribuição',
    visualizacoes: 38200,
    ctrThumbnail: 5.9,
    retencaoMedia: 41,
    watchTime: 1860,
    engajamento: 4.4,
    curtidas: 1420,
    comentarios: 246,
    dataPublicacao: '2026-02-08T14:00:00Z',
  },
]
