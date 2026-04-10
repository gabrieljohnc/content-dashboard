import { NextRequest, NextResponse } from 'next/server'
import { getIdeas, upsertIdea, deleteIdea } from '@/lib/supabase-service'
import type { IdeaRow } from '@/lib/supabase'

export async function GET() {
  try {
    const ideas = await getIdeas()
    return NextResponse.json(ideas)
  } catch (error) {
    console.error('GET /api/ideas error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as IdeaRow
    await upsertIdea(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/ideas error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await deleteIdea(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/ideas error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
