// ASU CreateAI REST client. Docs: https://docs.aiml.asu.edu (Query, Speech and Audio share POST /query).
// Verified against a project service token: text comes back as a string in `response`, speech as base64 MP3
// in `response`, and per-request system prompts only apply when request_source is "override_params".

const token = () => process.env.CREATEAI_API_KEY || process.env.CREATEAI_ACCESS_TOKEN || ''

const queryUrl = () =>
  process.env.CREATEAI_QUERY_URL || `${(process.env.CREATEAI_BASE_URL || 'https://api-main.aiml.asu.edu').replace(/\/$/, '')}/query`

export const createAIConfigured = () => Boolean(token())

export class RateLimitError extends Error {}

async function post(body: Record<string, unknown>, timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(queryUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      // Isolate every call: no project chat history or knowledge-base retrieval leaking into an interview.
      body: JSON.stringify({ request_source: 'override_params', enable_history: false, enable_search: false, ...body }),
      signal: controller.signal,
    })
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300)
      if (res.status === 429 || detail.includes('rate_limit')) {
        throw new RateLimitError("The CreateAI project hit its per-minute usage limit. Give it about a minute, then try again.")
      }
      throw new Error(`CreateAI ${res.status}: ${detail}`)
    }
    return res
  } finally {
    clearTimeout(timer)
  }
}

function extractText(data: unknown): string {
  if (typeof data === 'string') return data
  const d = data as { response?: unknown; text?: unknown; message?: unknown }
  if (typeof d?.response === 'string') return d.response
  if (d?.response && typeof (d.response as { response?: unknown }).response === 'string') {
    return (d.response as { response: string }).response
  }
  if (typeof d?.text === 'string') return d.text
  throw new Error(`CreateAI returned no text${typeof d?.message === 'string' ? `: ${d.message}` : ''}`)
}

export type ModelTier = 'deep' | 'fast'

// Deep tasks (audit, panel, debrief) run once behind animations, so they get the strongest model.
// Fast tasks run inside the interview loop, where every second of waiting is felt.
// "project-default" means the model configured on the CreateAI project itself.
function modelFields(tier: ModelTier) {
  const name =
    tier === 'fast' ? process.env.CREATEAI_FAST_MODEL_NAME || 'project-default' : process.env.CREATEAI_MODEL_NAME || 'gpt4o'
  if (name === 'project-default') return {}
  return { model_provider: process.env.CREATEAI_MODEL_PROVIDER || 'openai', model_name: name }
}

export async function createAIQuery(opts: { system: string; prompt: string; temperature: number; tier: ModelTier }) {
  const res = await post(
    {
      endpoint: 'query',
      action: 'query',
      ...modelFields(opts.tier),
      query: opts.prompt,
      model_params: { temperature: opts.temperature, system_prompt: opts.system },
      response_format: { type: 'json' },
    },
    60_000,
  )
  return extractText(await res.json())
}

export async function createAISpeech(text: string, voice: string): Promise<{ audio: Buffer; contentType: string }> {
  const res = await post(
    {
      endpoint: 'speech',
      agentic: false,
      model_provider: 'openai',
      model_name: process.env.CREATEAI_TTS_MODEL || 'tts1',
      voice,
      query: text,
    },
    30_000,
  )
  const type = res.headers.get('content-type') || ''
  if (type.startsWith('audio/') || type.includes('octet-stream')) {
    return { audio: Buffer.from(await res.arrayBuffer()), contentType: type.startsWith('audio/') ? type : 'audio/mpeg' }
  }
  const b64 = extractText(await res.json()).replace(/^data:audio\/[a-z0-9.+-]+;base64,/i, '')
  const audio = Buffer.from(b64, 'base64')
  if (audio.length < 200) throw new Error('CreateAI speech response had no audio payload')
  return { audio, contentType: 'audio/mpeg' }
}

export async function createAITranscribe(audio: Buffer): Promise<string> {
  const res = await post(
    {
      action: 'query',
      endpoint: 'audio',
      agentic: false,
      query: 'transcribe this',
      audio_file: audio.toString('base64'),
      model_provider: 'openai',
      model_name: 'whisper-1',
    },
    60_000,
  )
  return extractText(await res.json()).trim()
}
