import { NextRequest, NextResponse } from 'next/server'
import { getCompetitorNotes, insertCompetitorNote, deleteCompetitorNote } from '@/lib/supabase-service'
import type { CompetitorNoteRow } from '@/lib/supabase'

export async function GET() {
  try {
    const notes = await getCompetitorNotes()
    return NextResponse.json(notes)
  } catch (error) {
    console.error('GET /api/competitor-notes error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CompetitorNoteRow
    await insertCompetitorNote(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/competitor-notes error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await deleteCompetitorNote(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/competitor-notes error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
