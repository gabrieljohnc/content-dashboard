import { NextResponse } from 'next/server'
import { getFixedToken } from '@/lib/reportei-service'
import { listIntegrationsWithPlatforms } from '@/lib/analytics-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')

  if (!projectId) {
    return NextResponse.json({ error: 'project_id é obrigatório.' }, { status: 400 })
  }

  try {
    const token = getFixedToken()
    const integrations = await listIntegrationsWithPlatforms(token, parseInt(projectId))
    return NextResponse.json({ data: integrations })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar integrações' },
      { status: 500 }
    )
  }
}
