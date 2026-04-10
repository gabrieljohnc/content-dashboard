-- =============================================
-- Central do Conteudo — Supabase Schema
-- Execute this in Supabase SQL Editor
-- =============================================

-- 1. Posts (kanban de conteudo)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  legenda TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'feed',
  plataforma TEXT NOT NULL DEFAULT 'instagram',
  status TEXT NOT NULL DEFAULT 'backlog',
  responsavel TEXT NOT NULL DEFAULT 'John',
  tags TEXT[] DEFAULT '{}',
  link_canva TEXT,
  data_agendamento TIMESTAMPTZ,
  data_publicacao TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_plataforma ON posts(plataforma);

-- 2. Ideas (banco de ideias)
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  fontes TEXT,
  imagens TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ideia',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);

-- 3. Analytics Notes (notas por plataforma)
CREATE TABLE IF NOT EXISTS analytics_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plataforma TEXT NOT NULL,
  periodo_analise_start DATE,
  periodo_analise_end DATE,
  periodo_comparacao_start DATE,
  periodo_comparacao_end DATE,
  certo TEXT NOT NULL DEFAULT '',
  errado TEXT NOT NULL DEFAULT '',
  insight TEXT NOT NULL DEFAULT '',
  proxima_acao TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_notes_plataforma ON analytics_notes(plataforma);

-- 4. Competitor Notes (notas de analise de concorrentes)
CREATE TABLE IF NOT EXISTS competitor_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plataforma TEXT NOT NULL,
  texto TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitor_notes_plataforma ON competitor_notes(plataforma);

-- 5. Noticias Overrides (decisoes manuais sobre noticias Talvez)
CREATE TABLE IF NOT EXISTS noticias_overrides (
  noticia_id INTEGER PRIMARY KEY,
  decisao TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Noticias Processadas (tracking de noticias enviadas ao backlog)
CREATE TABLE IF NOT EXISTS noticias_processadas (
  noticia_id INTEGER PRIMARY KEY,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
