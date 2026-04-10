import { NextRequest, NextResponse } from 'next/server'
import { getPosts, upsertPost, deletePost, bulkUpsertPosts } from '@/lib/supabase-service'
import type { PostRow } from '@/lib/supabase'

export async function GET() {
  try {
    const posts = await getPosts()
    return NextResponse.json(posts)
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (Array.isArray(body)) {
      await bulkUpsertPosts(body as PostRow[])
    } else {
      await upsertPost(body as PostRow)
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
