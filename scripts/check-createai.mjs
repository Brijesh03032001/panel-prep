// Verifies your CreateAI token, model choice and response shapes before a live demo.
// Usage: node --env-file=.env.local scripts/check-createai.mjs
const QUERY_URL = process.env.CREATEAI_QUERY_URL || `${(process.env.CREATEAI_BASE_URL || 'https://api-main.aiml.asu.edu').replace(/\/$/, '')}/query`
const KEY = process.env.CREATEAI_API_KEY || process.env.CREATEAI_ACCESS_TOKEN
if (!KEY) {
  console.error('CREATEAI_API_KEY is not set. Add it to .env.local and run: node --env-file=.env.local scripts/check-createai.mjs')
  process.exit(1)
}

async function call(label, body) {
  const started = Date.now()
  const res = await fetch(QUERY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_source: 'override_params', enable_history: false, enable_search: false, ...body }),
  })
  const type = res.headers.get('content-type') || ''
  const ms = Date.now() - started
  if (!res.ok) {
    console.log(`✗ ${label}: HTTP ${res.status} in ${ms}ms\n  ${(await res.text()).slice(0, 400)}`)
    return null
  }
  if (type.startsWith('audio/')) {
    const buf = Buffer.from(await res.arrayBuffer())
    console.log(`✓ ${label}: ${buf.length} bytes of ${type} in ${ms}ms`)
    return buf
  }
  const json = await res.json()
  console.log(`✓ ${label}: ${ms}ms, top-level keys: ${Object.keys(json).join(', ')}`)
  return json
}

const query = await call('Query (JSON mode)', {
  endpoint: 'query',
  action: 'query',
  model_provider: process.env.CREATEAI_MODEL_PROVIDER || 'openai',
  model_name: process.env.CREATEAI_MODEL_NAME || 'gpt4o',
  query: 'Return {"ok": true, "panel": "ready"} as JSON.',
  model_params: { temperature: 0, system_prompt: 'Reply with one JSON object only.' },
  response_format: { type: 'json' },
})
if (query) {
  const text = typeof query.response === 'string' ? query.response : query.response?.response
  console.log(`  generated text: ${String(text).slice(0, 200)}`)
}

const speech = await call('Speech (tts1, voice "nova")', {
  endpoint: 'speech',
  agentic: false,
  model_provider: 'openai',
  model_name: process.env.CREATEAI_TTS_MODEL || 'tts1',
  voice: 'nova',
  query: 'Hi, I am Priya. Tell me about your project.',
})
const audioB64 = Buffer.isBuffer(speech) ? speech.toString('base64') : speech?.response
if (audioB64) {
  const heard = await call('Audio (whisper-1 transcription of the speech above)', {
    action: 'query',
    endpoint: 'audio',
    agentic: false,
    query: 'transcribe this',
    audio_file: audioB64,
    model_provider: 'openai',
    model_name: 'whisper-1',
  })
  if (heard) console.log(`  transcript: ${String(heard.response).slice(0, 200)}`)
}

console.log('\nIf Query failed, try a different CREATEAI_MODEL_PROVIDER / CREATEAI_MODEL_NAME from https://docs.aiml.asu.edu/models')
