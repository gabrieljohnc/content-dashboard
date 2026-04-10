import { NextRequest, NextResponse } from 'next/server'
import { getNoticiasProcessadas, markNoticiasProcessadas } from '@/lib/supabase-service'

export async function GET() {
  try {
    const ids = await getNoticiasProcessadas()
    return NextResponse.json(ids)
  } catch (error) {
    console.error('GET /api/noticias-processadas error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json()
    await markNoticiasProcessadas(ids)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/noticias-processadas error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
