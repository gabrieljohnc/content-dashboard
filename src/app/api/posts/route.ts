import { NextRequest, NextResponse } from 'next/server'
import { getPosts, upsertPost, deletePost, bulkUpsertPosts, postToRow, rowToPost } from '@/lib/supabase-service'
import type { Post } from '@/lib/types'

export async function GET() {
  try {
    const rows = await getPosts()
    return NextResponse.json(rows.map(rowToPost))
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (Array.isArray(body)) {
      const rows = (body as Post[]).map(postToRow)
      await bulkUpsertPosts(rows)
    } else {
      await upsertPost(postToRow(body as Post))
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/posts error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await deletePost(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/posts error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
