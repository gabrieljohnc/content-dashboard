import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsNotes, getAllAnalyticsNotes, upsertAnalyticsNote, deleteAnalyticsNote } from '@/lib/supabase-service'
import type { AnalyticsNoteRow } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const plataforma = req.nextUrl.searchParams.get('plataforma')
    const notes = plataforma ? await getAnalyticsNotes(plataforma) : await getAllAnalyticsNotes()
    return NextResponse.json(notes)
  } catch (error) {
    console.error('GET /api/analytics-notes error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as AnalyticsNoteRow
    await upsertAnalyticsNote(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/analytics-notes error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await deleteAnalyticsNote(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/analytics-notes error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
