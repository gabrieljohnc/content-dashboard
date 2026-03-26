'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  useProjects,
  useIntegrations,
  useSelectedProject,
  clearReporteiCache,
} from '@/hooks/use-reportei'
import { PLATFORM_COLORS } from '@/lib/constants'

export function ReporteiConfig() {
  const [selectedProjectId, setSelectedProjectId] = useSelectedProject()
  const [isExpanded, setIsExpanded] = useState(!selectedProjectId)

  const { projects, loading: loadingProjects, error: projectsError } = useProjects()
  const { integrations, loading: loadingIntegrations } = useIntegrations(selectedProjectId)

  const isConfigured = !!selectedProjectId
  const platformIntegrations = integrations.filter((i) => i.platform)

  async function handleClearCache() {
    await clearReporteiCache()
    window.location.reload()
  }

  return (
    <Card className={isConfigured && !isExpanded ? '' : 'ring-1 ring-blue-500/30'}>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              Conexão Reportei
              {isConfigured ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                  Conectado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">
                  Selecione um projeto
                </Badge>
              )}
            </CardTitle>
            {isConfigured && !isExpanded && (
              <CardDescription className="text-xs mt-1">
                Projeto: {projects.find((p) => p.id === selectedProjectId)?.name || selectedProjectId}
                {' · '}
                {platformIntegrations.length} plataformas conectadas
              </CardDescription>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="flex flex-col gap-5">
          {/* Token Status */}
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Token configurado automaticamente</span>
          </div>

          {projectsError && (
            <p className="text-xs text-red-400">Erro: {projectsError}</p>
          )}

          {/* Project Selection */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold">Projeto</Label>
            {loadingProjects ? (
              <div className="h-10 animate-pulse rounded-md bg-muted/30" />
            ) : projects.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum projeto encontrado. Verifique a conexão com o Reportei.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={[
                      'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                      selectedProjectId === project.id
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-zinc-700 text-muted-foreground hover:border-zinc-500 hover:text-foreground',
                    ].join(' ')}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Integrations Status */}
          {selectedProjectId && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">Integrações Detectadas</Label>
              {loadingIntegrations ? (
                <div className="h-8 animate-pulse rounded-md bg-muted/30" />
              ) : platformIntegrations.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma integração de redes sociais encontrada neste projeto.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {platformIntegrations.map((integration) => {
                    const platformKey = integration.platform?.toLowerCase() as keyof typeof PLATFORM_COLORS
                    const color = PLATFORM_COLORS[platformKey] || '#888'
                    return (
                      <Badge
                        key={integration.id}
                        className="text-xs"
                        style={{
                          backgroundColor: `${color}22`,
                          color,
                          borderColor: `${color}44`,
                        }}
                      >
                        {integration.platform} ({integration.slug})
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {isConfigured && (
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                className="text-xs"
              >
                Limpar Cache da API
              </Button>
              <span className="text-[10px] text-muted-foreground">
                Cache: 5min para dados, 10min para projetos
              </span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Hook to get current config state
// ---------------------------------------------------------------------------

export function useReporteiConfig() {
  const [projectId] = useSelectedProject()
  return {
    projectId,
    isConfigured: !!projectId,
  }
}
