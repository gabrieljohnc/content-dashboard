import { NextResponse } from 'next/server'
import { getProjects, getFixedToken } from '@/lib/reportei-service'

export async function GET() {
  try {
    const token = getFixedToken()
    const projects = await getProjects(token)
    return NextResponse.json({ data: projects })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar projetos' },
      { status: 500 }
    )
  }
}
