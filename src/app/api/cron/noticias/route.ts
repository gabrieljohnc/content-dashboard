import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function GET() {
  try {
    revalidateTag('noticias', 'max')
    return NextResponse.json({ revalidated: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Cron noticias error:', error)
    return NextResponse.json({ revalidated: false, error: String(error) }, { status: 500 })
  }
}
