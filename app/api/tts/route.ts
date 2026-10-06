import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createAIConfigured, createAISpeech, RateLimitError } from '@/lib/server/createai'
import { errorMessage } from '@/lib/server/http'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const VOICES = new Set(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
const CACHE_DIR = path.join(process.env.VERCEL ? '/tmp' : process.cwd(), 'data', 'tts-cache')
// Committed copies of the demo's voice lines (npm run warm:demo), so a fresh deploy has voices with no token.
const DEMO_DIR = path.join(process.cwd(), 'assets', 'demo-voices')

// Audio is cached on disk, so a demo rehearsed once with a token replays its voices even offline.
export async function POST(req: Request) {
  const { text, voice } = (await req.json().catch(() => ({}))) as { text?: string; voice?: string }
  const clean = String(text ?? '').trim().slice(0, 700)
  const v = VOICES.has(String(voice)) ? String(voice) : 'alloy'
  if (!clean) return Response.json({ error: 'No text' }, { status: 400 })

  const name = `${crypto.createHash('sha1').update(`${v}:${clean}`).digest('hex')}.mp3`
  const file = path.join(CACHE_DIR, name)
  for (const cached of [path.join(DEMO_DIR, name), file]) {
    if (fs.existsSync(cached)) {
      return new Response(fs.readFileSync(cached), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } })
    }
  }
  if (!createAIConfigured()) return Response.json({ error: 'Voice needs CREATEAI_API_KEY' }, { status: 501 })

  try {
    const { audio, contentType } = await createAISpeech(clean, v)
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(file, audio)
    return new Response(new Uint8Array(audio), { headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' } })
  } catch (err) {
    // The browser falls back to its own voices, so a failed line never blocks the interview.
    if (!(err instanceof RateLimitError)) console.error('[panel-prep] tts', err)
    return Response.json({ error: errorMessage(err) }, { status: err instanceof RateLimitError ? 429 : 502 })
  }
}
