import { NextResponse } from 'next/server'
import { createAIConfigured } from '@/lib/server/createai'
import { activeProvider } from '@/lib/server/llm'
import type { AppConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'

export function GET() {
  const provider = activeProvider()
  const config: AppConfig = { live: provider !== null, tts: createAIConfigured(), stt: createAIConfigured(), provider }
  return NextResponse.json(config)
}
