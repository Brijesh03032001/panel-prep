import { NextResponse } from 'next/server'
import { createAIConfigured, createAITranscribe } from '@/lib/server/createai'
import { errorMessage } from '@/lib/server/http'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Student voice stays inside ASU-approved services (CreateAI Whisper) instead of the browser vendor's cloud.
export async function POST(req: Request) {
  if (!createAIConfigured()) return NextResponse.json({ error: 'Transcription needs CREATEAI_API_KEY' }, { status: 501 })
  try {
    const form = await req.formData()
    const audio = form.get('audio')
    if (!(audio instanceof File) || audio.size === 0) return NextResponse.json({ error: 'No audio' }, { status: 400 })
    if (audio.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Recording is too long' }, { status: 413 })
    const text = await createAITranscribe(Buffer.from(await audio.arrayBuffer()))
    return NextResponse.json({ text })
  } catch (err) {
    console.error('[mockify] transcribe', err)
    return NextResponse.json({ error: errorMessage(err) }, { status: 502 })
  }
}
