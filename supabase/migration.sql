-- =============================================
-- Central do Conteudo — Supabase Schema
-- Execute this in Supabase SQL Editor
-- =============================================

-- 1. Posts (kanban de conteudo)
-- NOTE: Backlog card refactor (2026-04-15)
--   - `tipo` renomeado para `formato` e com valores novos
--   - `plataforma` passa a ser opcional (sem NOT NULL / sem default)
--   - novos campos: objetivo, publico, mensagem_principal, cta
--   - removidos: responsavel, link_canva
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  legenda TEXT NOT NULL DEFAULT '',
  formato TEXT,
  plataforma TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  objetivo TEXT,
  publico TEXT,
  mensagem_principal TEXT,
  cta TEXT,
  tags TEXT[] DEFAULT '{}',
  data_agendamento TIMESTAMPTZ,
  data_publicacao TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_plataforma ON posts(plataforma);

-- ---------------------------------------------------------------
-- Migration patch (idempotente) — aplica em bancos já existentes:
-- rename tipo -> formato, drop defaults/NOT NULL, mapeia valores
-- antigos, adiciona novas colunas, remove colunas descontinuadas.
-- ---------------------------------------------------------------
DO $$
BEGIN
  -- Rename tipo -> formato se ainda existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'tipo'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'formato'
  ) THEN
    EXECUTE 'ALTER TABLE posts RENAME COLUMN tipo TO formato';
  END IF;

  -- Formato fica nullable sem default
  EXECUTE 'ALTER TABLE posts ALTER COLUMN formato DROP NOT NULL';
  EXECUTE 'ALTER TABLE posts ALTER COLUMN formato DROP DEFAULT';

  -- Mapear valores antigos de tipo -> formato novo
  EXECUTE 'UPDATE posts SET formato = ''post-estatico'' WHERE formato = ''feed''';
  EXECUTE 'UPDATE posts SET formato = NULL WHERE formato IN (''video'', ''artigo'')';

  -- Plataforma passa a ser nullable sem default
  EXECUTE 'ALTER TABLE posts ALTER COLUMN plataforma DROP NOT NULL';
  EXECUTE 'ALTER TABLE posts ALTER COLUMN plataforma DROP DEFAULT';

  -- Novas colunas
  EXECUTE 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS objetivo TEXT';
  EXECUTE 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS publico TEXT';
  EXECUTE 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS mensagem_principal TEXT';
  EXECUTE 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS cta TEXT';

  -- Colunas descontinuadas
  EXECUTE 'ALTER TABLE posts DROP COLUMN IF EXISTS responsavel';
  EXECUTE 'ALTER TABLE posts DROP COLUMN IF EXISTS link_canva';
END $$;

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
