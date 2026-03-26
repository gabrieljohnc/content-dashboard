import { NextResponse } from 'next/server'
import { getFixedToken } from '@/lib/reportei-service'
import { collectPlatformData, generateInsights } from '@/lib/analytics-service'

export async function POST(request: Request) {
  try {
    const token = getFixedToken()
    const body = await request.json()
    const { project_id, start, end, comparison_start, comparison_end } = body

    if (!project_id || !start || !end) {
      return NextResponse.json(
        { error: 'project_id, start e end são obrigatórios.' },
        { status: 400 }
      )
    }

    const platformData = await collectPlatformData(token, project_id, start, end, comparison_start, comparison_end)
    const insights = generateInsights(platformData)

    return NextResponse.json({
      data: platformData,
      insights,
      period: { start, end },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao coletar dados' },
      { status: 500 }
    )
  }
}
