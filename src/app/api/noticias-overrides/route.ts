import { NextRequest, NextResponse } from 'next/server'
import { getNoticiasOverrides, upsertNoticiaOverride } from '@/lib/supabase-service'

export async function GET() {
  try {
    const overrides = await getNoticiasOverrides()
    // Return as Record<number, string> for client compatibility
    const map: Record<number, string> = {}
    for (const row of overrides) {
      map[row.noticia_id] = row.decisao
    }
    return NextResponse.json(map)
  } catch (error) {
    console.error('GET /api/noticias-overrides error:', error)
    return NextResponse.json({}, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { noticia_id, decisao } = await req.json()
    await upsertNoticiaOverride(noticia_id, decisao)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/noticias-overrides error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
