-- Central do Conteúdo — Schema para métricas diárias
-- Executar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS daily_metrics (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id      INTEGER NOT NULL,
  platform        TEXT NOT NULL CHECK (platform IN ('Instagram', 'LinkedIn', 'YouTube')),
  date            DATE NOT NULL,
  metrics         JSONB NOT NULL DEFAULT '{}',
  integration_id  INTEGER,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_daily_metrics UNIQUE (project_id, platform, date)
);

-- Índice principal: busca por projeto + plataforma + range de datas
CREATE INDEX idx_daily_metrics_lookup
  ON daily_metrics (project_id, platform, date);

-- Índice para verificar última sincronização
CREATE INDEX idx_daily_metrics_synced
  ON daily_metrics (project_id, synced_at);
