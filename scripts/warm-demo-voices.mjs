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

// Must match coachSpeech() in lib/store.ts, so the cached file is found for Sam's Lifeline.
const coachLine = c => `${c.encouragement} Here's how to answer. ${c.outline.map((o, i) => `${['First', 'Then', 'Finally'][i] ?? 'And'}, ${o.replace(/\.$/, '')}.`).join(' ')}`

// Each plan takes a different branch (Lifeline after an answer, before one, or Move on) so every scripted
// question and every coaching line gets voiced. `stop` ends the interview early, which voices the
// "didn't get to ask" lines of the debrief.
const PATHS = [
  { steps: ['lifeline'] },
  { steps: ['move-on', 'lifeline'] },
  { steps: ['move-on', 'move-on', 'lifeline'] },
  { steps: ['move-on', 'move-on', 'move-on', 'move-on', 'pre'] },
  { steps: ['lifeline'], stop: 1 },
  { steps: ['lifeline'], stop: 2 },
  { steps: ['move-on'], stop: 1 },
]

for (const plan of PATHS) {
  const form = new FormData()
  form.append('mode', 'demo')
  let { session } = await call('/api/sessions', form)
  ;({ session } = await call(`/api/sessions/${session.id}/panel`))
  const voiceOf = id => session.panel.find(p => p.id === id).voice
  // Must match introOf() in components/pp/screens/assemble.tsx.
  for (const p of session.panel) say(p.intro || `Hi, I'm ${p.name}, ${p.title}.`, p.voice)

  let { turn } = await call(`/api/sessions/${session.id}/turn`)
  for (let q = 0; turn && q < (plan.stop ?? 99); q++) {
    const step = plan.steps[q] ?? 'move-on'
    say(turn.question, voiceOf(turn.interviewerId))
    if (step === 'pre' && turn.coachable !== false) {
      const { coaching } = await call(`/api/sessions/${session.id}/lifeline`, { turnId: turn.id })
      say(coachLine(coaching), COACH_VOICE)
    }
    let events = await call(`/api/sessions/${session.id}/answer`, { turnId: turn.id, answer: 'scripted demo answer' })
    if (events.some(e => e.type === 'decision')) {
      if (step === 'lifeline') {
        const { coaching } = await call(`/api/sessions/${session.id}/lifeline`, { turnId: turn.id })
        say(coachLine(coaching), COACH_VOICE)
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

// Ryan's staged pitch run (lib/server/demo/ryan.ts) goes through the live form, so it is voiced the same way: his
// resume text triggers the script. Each plan ends at a different point, with or without the Lifeline on Leo's
// follow-up (the pitch path), so every scripted question, Sam's coaching and every huddle line he can reach gets
// voiced. Answering past Marcus's first question would reach the live model.
const RYAN_RESUME = `RYAN BROOKS
EXPERIENCE
Web Developer (part-time), Copper Canyon Credit Union
- Set up CI with GitHub Actions and preview deploys on every pull request
PROJECTS
ShelfLife, grocery expiry tracker
- Wrote unit and integration tests with Jest and React Testing Library (90% coverage)`

const RYAN_PATHS = [
  { steps: [], stop: 1 },
  { steps: [], stop: 2 },
  { steps: [], stop: 3 },
  { steps: ['move-on', 'lifeline'], stop: 2 },
  { steps: ['move-on', 'lifeline'], stop: 3 },
]

for (const plan of RYAN_PATHS) {
  const form = new FormData()
  form.append('mode', 'live')
  form.append('text', RYAN_RESUME)
  form.append('roleKey', 'frontend')
  form.append('level', 'New Grad')
  let { session } = await call('/api/sessions', form)
  if (session.scenario !== 'ryan') throw new Error("Ryan's resume didn't start the staged run. Check lib/server/demo/staged.ts.")
  ;({ session } = await call(`/api/sessions/${session.id}/panel`))
  const voiceOf = id => session.panel.find(p => p.id === id).voice
  for (const p of session.panel) say(p.intro || `Hi, I'm ${p.name}, ${p.title}.`, p.voice)

  let { turn } = await call(`/api/sessions/${session.id}/turn`)
  for (let q = 0; turn && q < plan.stop; q++) {
    say(turn.question, voiceOf(turn.interviewerId))
    let events = await call(`/api/sessions/${session.id}/answer`, { turnId: turn.id, answer: 'scripted demo answer' })
    if (events.some(e => e.type === 'decision') && plan.steps[q] === 'lifeline') {
      const { coaching } = await call(`/api/sessions/${session.id}/lifeline`, { turnId: turn.id })
      say(coachLine(coaching), COACH_VOICE)
      events = await call(`/api/sessions/${session.id}/answer`, { turnId: turn.id, answer: 'scripted demo retry' })
      turn = events.find(e => e.type === 'next')?.turn ?? null
    } else if (events.some(e => e.type === 'decision')) turn = (await call(`/api/sessions/${session.id}/next`, { turnId: turn.id })).turn ?? null
    else turn = events.find(e => e.type === 'next')?.turn ?? null
  }
  // The question already queued when the presenter ends (Marcus's follow-up on the pitch path).
  if (turn) say(turn.question, voiceOf(turn.interviewerId))
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
// Drop voices for lines the script no longer uses, so the repo only ships what the demo can play.
const keep = new Set([...lines.values()].map(({ text, voice }) => fileFor(voice, text)))
let pruned = 0
for (const f of fs.readdirSync(DEMO)) {
  if (f.endsWith('.mp3') && !keep.has(f)) {
    fs.unlinkSync(path.join(DEMO, f))
    pruned++
  }
}
console.log(`Cached ${ok} of ${lines.size} demo voice lines; ${copied} copied to assets/demo-voices for deploys, ${pruned} unused removed.`)
