// Pre-generates every voice line of Maya's demo into data/tts-cache, so the demo plays real CreateAI voices
// instantly and keeps working offline. Needs the app running with a CreateAI token.
// Usage: npm run warm:demo            (or: BASE=http://localhost:3100 npm run warm:demo)

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE || process.argv[2] || 'http://localhost:3000'
const CACHE = path.join(process.cwd(), 'data', 'tts-cache')
const DEMO = path.join(process.cwd(), 'assets', 'demo-voices')
// Same key as app/api/tts/route.ts.
const fileFor = (voice, text) => `${crypto.createHash('sha1').update(`${voice}:${text.trim().slice(0, 700)}`).digest('hex')}.mp3`
const COACH_VOICE = 'shimmer'

async function call(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (path.endsWith('/answer')) return text.trim().split('\n').map(l => JSON.parse(l))
  const json = JSON.parse(text)
  if (!res.ok) throw new Error(`${path}: ${json.error ?? res.status}`)
  return json
}

const lines = new Map()
const say = (text, voice) => text && lines.set(`${voice}:${text}`, { text, voice })

// Each path takes a different Lifeline branch so every scripted hint gets voiced.
const PATHS = [
  ['lifeline-after', 'answer', 'answer'],
  ['move-on', 'lifeline-after', 'answer'],
  ['move-on', 'move-on', 'lifeline-before'],
]

for (const plan of PATHS) {
  const form = new FormData()
  form.append('mode', 'demo')
  let { session } = await call('/api/sessions', form)
  ;({ session } = await call(`/api/sessions/${session.id}/panel`))
  const voiceOf = id => session.panel.find(p => p.id === id).voice
  for (const p of session.panel) say(`I'm ${p.name.split(' ')[0]}, ${p.title}. ${p.joinReason}`, p.voice)

  let { turn } = await call(`/api/sessions/${session.id}/turn`)
  for (const step of plan) {
    if (!turn) break
    say(turn.question, voiceOf(turn.interviewerId))
    if (step === 'lifeline-before') {
      const hint = await call(`/api/sessions/${session.id}/lifeline`, { turnId: turn.id })
      say(`${hint.encouragement} ${hint.hint}`, COACH_VOICE)
    }
    let events = await call(`/api/sessions/${session.id}/answer`, { turnId: turn.id, answer: 'scripted demo answer' })
    if (events.some(e => e.type === 'decision')) {
      if (step === 'lifeline-after') {
        const hint = await call(`/api/sessions/${session.id}/lifeline`, { turnId: turn.id })
        say(`${hint.encouragement} ${hint.hint}`, COACH_VOICE)
        events = await call(`/api/sessions/${session.id}/answer`, { turnId: turn.id, answer: 'scripted demo retry' })
      } else {
        const next = await call(`/api/sessions/${session.id}/next`, { turnId: turn.id })
        events = [next.turn ? { type: 'next', turn: next.turn } : { type: 'end' }]
      }
    }
    turn = events.find(e => e.type === 'next')?.turn ?? null
  }
  const done = await call(`/api/sessions/${session.id}/finish`)
  for (const h of done.session.outcome.huddle) say(h.line, voiceOf(h.interviewerId))
  await fetch(`${BASE}/api/sessions/${session.id}`, { method: 'DELETE' })
}

// Paced, with patient retries: CreateAI projects have a tokens-per-minute limit.
let ok = 0
for (const { text, voice } of lines.values()) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${BASE}/api/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice }) })
    if (res.ok) {
      ok++
      break
    }
    if (attempt === 4) console.log(`✗ ${voice}: ${text.slice(0, 60)}… (${res.status})`)
    else {
      console.log(`  waiting for the CreateAI rate limit (${res.status})…`)
      await new Promise(r => setTimeout(r, 30_000))
    }
  }
  await new Promise(r => setTimeout(r, 1500))
}
fs.mkdirSync(DEMO, { recursive: true })
let copied = 0
for (const { text, voice } of lines.values()) {
  const src = path.join(CACHE, fileFor(voice, text))
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DEMO, fileFor(voice, text)))
    copied++
  }
}
console.log(`Cached ${ok} of ${lines.size} demo voice lines; ${copied} copied to assets/demo-voices for deploys.`)
