import fs from 'node:fs'
import path from 'node:path'
import { Groq } from 'groq-sdk'
import { createAIConfigured, createAIQuery, RateLimitError, type ModelTier } from './createai'
import { demoFixture } from './demo/maya'
import type { Mode } from '../types'

export class ProviderUnavailableError extends Error {}

export interface LLMCall {
  key: string
  system: string
  prompt: string
  temperature?: number
}

const FAST_TASKS = ['audit', 'question:', 'evaluate:', 'coach:']
const tierFor = (key: string): ModelTier => (FAST_TASKS.some(p => key.startsWith(p)) ? 'fast' : 'deep')

export function activeProvider(): string | null {
  if (createAIConfigured()) return 'ASU CreateAI'
  if (process.env.GROQ_API_KEY) return 'Groq (dev fallback)'
  return null
}

async function complete(call: LLMCall): Promise<string> {
  const temperature = call.temperature ?? 0.4
  if (createAIConfigured()) {
    return createAIQuery({ system: call.system, prompt: call.prompt, temperature, tier: tierFor(call.key) })
  }
  if (process.env.GROQ_API_KEY) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const out = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: call.system },
        { role: 'user', content: call.prompt },
      ],
    })
    return out.choices[0]?.message?.content ?? ''
  }
  throw new ProviderUnavailableError(
    'Live mode needs an AI provider. Add CREATEAI_API_KEY to .env.local, or try the demo session.',
  )
}

// Fixes the two slips faster models make: unquoted ids in arrays ([L2, L3]) and trailing commas.
function repairJSON(s: string) {
  return s.replace(/([\[,]\s*)(L\d+|i\d+c\d+|i\d+)(?=\s*[,\]])/g, '$1"$2"').replace(/,\s*([}\]])/g, '$1')
}

export function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  const body = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned
  for (const candidate of [cleaned, body, repairJSON(body)]) {
    try {
      return JSON.parse(candidate) as T
    } catch {}
  }
  throw new Error('Model did not return valid JSON')
}

function record(sessionId: string, key: string, value: unknown) {
  if (process.env.RECORD_FIXTURES !== '1') return
  const dir = path.join(process.cwd(), 'data', 'recordings')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${sessionId}.json`)
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  existing[key] = value
  fs.writeFileSync(file, JSON.stringify(existing, null, 2))
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function callJSON<T>(ctx: { mode: Mode; sessionId: string }, call: LLMCall): Promise<T> {
  if (ctx.mode === 'demo') {
    const fixture = demoFixture(call.key)
    if (!fixture) throw new Error(`The demo script doesn't cover this step (${call.key}). Start a live session to go off-script.`)
    await sleep(500 + Math.random() * 600)
    return structuredClone(fixture) as T
  }
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await complete(
        attempt === 0 ? call : { ...call, prompt: `${call.prompt}\n\nReturn ONLY one valid JSON object. No prose, no code fences.` },
      )
      const parsed = parseJSON<T>(raw)
      record(ctx.sessionId, call.key, parsed)
      return parsed
    } catch (err) {
      if (err instanceof ProviderUnavailableError) throw err
      // A per-minute limit often clears within seconds of the previous burst; wait once before giving up.
      if (err instanceof RateLimitError) {
        if (attempt === 1) throw err
        await sleep(8000)
      }
      lastError = err
    }
  }
  throw lastError instanceof Error ? lastError : new Error('AI call failed')
}
