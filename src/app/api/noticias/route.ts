import { NextResponse } from 'next/server'

export const XANO_URL = 'https://xrvz-d0dv-io1r.n7e.xano.io/api:MaVekL4j/newsletter_noticias'

export async function GET() {
  try {
    const res = await fetch(XANO_URL, {
      next: { tags: ['noticias'], revalidate: 43200 }, // 12h fallback, revalidated by cron
    })
    if (!res.ok) throw new Error(`Xano responded ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Xano fetch error:', error)
    return NextResponse.json([], { status: 500 })
  }
}
