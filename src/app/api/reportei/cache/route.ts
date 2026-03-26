import { NextResponse } from 'next/server'
import { clearCache } from '@/lib/reportei-service'

export async function DELETE() {
  clearCache()
  return NextResponse.json({ message: 'Cache limpo com sucesso.' })
}
