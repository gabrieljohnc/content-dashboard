import { NextResponse } from 'next/server'
import { getAvailableMetrics, getFixedToken } from '@/lib/reportei-service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('integration_slug')

  if (!slug) {
    return NextResponse.json({ error: 'integration_slug é obrigatório.' }, { status: 400 })
  }

  try {
    const token = getFixedToken()
    const metrics = await getAvailableMetrics(token, slug)
    return NextResponse.json({ data: metrics })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar métricas disponíveis' },
      { status: 500 }
    )
  }
}
