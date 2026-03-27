import { NextResponse } from 'next/server'

// RSS feeds related to Brazilian energy distribution market
const RSS_FEEDS = [
  { url: 'https://www.canalenergia.com.br/rss', fonte: 'Canal Energia' },
  { url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml', fonte: 'Agência Brasil' },
  { url: 'https://www.portalsolar.com.br/feed', fonte: 'Portal Solar' },
]

interface RSSItem {
  title: string
  link: string
  pubDate: string
  contentSnippet?: string
  content?: string
}

export async function GET() {
  try {
    // Dynamic import rss-parser to avoid bundling issues
    const Parser = (await import('rss-parser')).default
    const parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'CentralDoConteudo/1.0',
      },
    })

    const allItems: Array<{
      titulo: string
      fonte: string
      url: string
      dataPublicacao: string
      resumo: string
    }> = []

    for (const feed of RSS_FEEDS) {
      try {
        const result = await parser.parseURL(feed.url)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (result.items || []).slice(0, 10).map((item: any) => ({
          titulo: item.title || 'Sem título',
          fonte: feed.fonte,
          url: item.link || '',
          dataPublicacao: item.pubDate || new Date().toISOString(),
          resumo: (item.contentSnippet || item.content || '').slice(0, 200).replace(/<[^>]*>/g, ''),
        }))
        allItems.push(...items)
      } catch {
        // Skip failed feeds silently
        console.warn(`Failed to fetch feed: ${feed.fonte}`)
      }
    }

    // Sort by date, newest first
    allItems.sort((a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime())

    return NextResponse.json(allItems)
  } catch (error) {
    console.error('RSS fetch error:', error)
    return NextResponse.json([], { status: 500 })
  }
}
