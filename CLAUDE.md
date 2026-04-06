# ContentHub - Dashboard de Marketing

## Stack Tecnológico
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4
- **Componentes UI**: shadcn/ui (tema escuro)
- **Gráficos**: Recharts (incluindo RadarChart)
- **Drag & Drop**: @dnd-kit (core + sortable)
- **RSS Parsing**: rss-parser (server-side)
- **API de Analytics**: Reportei V2 (https://app.reportei.com/api/v2)
- **Datas**: date-fns com locale pt-BR
- **Ícones**: Lucide React
- **Deploy**: Vercel

## Estrutura de Pastas
```
src/
├── app/
│   ├── page.tsx                    # Home / visão geral
│   ├── layout.tsx                  # Layout global (sidebar + dark theme)
│   ├── instagram/                  # Gerenciador de conteúdo (kanban)
│   ├── analytics/                  # Dashboard de analytics (mock + Reportei)
│   ├── calendario/                 # Calendário editorial mensal
│   ├── concorrentes/               # Monitoramento de concorrentes
│   ├── noticias/                   # Agregador de notícias RSS
│   └── api/
│       ├── rss/                    # API route para fetch de RSS
│       └── reportei/               # Proxy para API Reportei V2
│           ├── projects/           # GET /v2/projects
│           ├── integrations/       # GET /v2/integrations
│           ├── metrics/            # GET métricas disponíveis
│           │   └── data/           # POST coleta de dados
│           └── cache/              # DELETE limpar cache
├── components/
│   ├── ui/                         # Componentes shadcn/ui
│   ├── layout/
│   │   └── sidebar.tsx             # Navegação lateral
│   └── analytics/
│       └── reportei-config.tsx     # Configuração conexão Reportei
├── hooks/
│   ├── use-local-storage.ts        # Hook de persistência
│   └── use-reportei.ts            # Hooks para API Reportei
└── lib/
    ├── types.ts                    # Types compartilhados + métricas por plataforma
    ├── constants.ts                # Cores, labels, constantes
    ├── storage.ts                  # Helpers localStorage
    ├── mock-data.ts                # Dados mockados realistas
    ├── utils.ts                    # Utilitários (cn)
    ├── reportei-types.ts           # Types da API Reportei V2
    ├── reportei-service.ts         # Serviço baixo nível (fetch + cache + rate limit)
    └── analytics-service.ts        # Serviço alto nível (orquestração + insights)
```

## Integração Reportei V2

### Fluxo de dados
1. `GET /v2/projects` → Identifica o projeto
2. `GET /v2/integrations?project_id={id}` → Mapeia plataformas (slug → Platform)
3. `GET /v2/metrics?integration_slug={slug}` → Descobre métricas disponíveis
4. `POST /v2/metrics/get-data` → Coleta dados com comparação de período

### Configuração
- Token pode ser configurado via interface (salvo em localStorage) ou via `.env.local` (`REPORTEI_TOKEN`)
- Projeto selecionado via interface
- Cache server-side: 5min dados, 10min projetos, 30min definições de métricas
- Rate limiting: 120 GET/min, 30 POST/min

### Slugs suportados
- `instagram` / `facebook_ads` → Instagram
- `linkedin` → LinkedIn
- `youtube` → YouTube

## Analytics — Métricas por Plataforma

### Instagram (Atenção e Distribuição)
- **KPIs**: Alcance, Salvamentos, Compartilhamentos, Watch Time
- Insight: "Salvamento e compartilhamento = conteúdo forte. Watch Time e interações no Direct = conexão real."

### LinkedIn (Autoridade e Conversão)
- **KPIs**: Impressões, Comentários, CTR, Seguidores Qualificados
- Insight: "LinkedIn é rede de conversa, não de like."

### YouTube (Retenção e Profundidade)
- **KPIs**: Watch Time, Retenção Média, CTR Thumbnail, Inscrições/Vídeo
- Insight: "YouTube não liga pra view, liga pra tempo que você prende a pessoa."

## Convenções
- **Idioma**: Toda interface em PT-BR
- **Tema**: Escuro global (className="dark" no html)
- **Storage**: localStorage com chaves prefixadas `content-dashboard:`
- **Componentes**: 'use client' em pages interativas
- **Cores de plataforma**: Instagram (#E1306C), LinkedIn (#0A66C2), YouTube (#FF0000)
- **API routes**: Proxy server-side para proteger tokens

## Decisões Importantes
1. **Dual data source**: Mock data sempre disponível + Reportei real quando conectado
2. **Proxy server-side**: Token nunca exposto no client — API routes intermediam
3. **Cache em memória**: Evita exceder rate limits do Reportei
4. **Métricas específicas por plataforma**: Cada rede tem seus KPIs próprios (não genéricos)
5. **Insights automáticos**: Gerados a partir dos dados comparativos
6. **Nicho**: Mercado de distribuição de energia no Brasil

## Comandos
```bash
npm run dev    # Servidor de desenvolvimento
npm run build  # Build de produção
npm run start  # Servidor de produção
npm run lint   # Linter
```

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
