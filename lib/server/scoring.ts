import { domainLabel } from '../catalog'
import type { Concern, Interviewer, Outcome, Reaction, SessionDoc, VerdictLabel } from '../types'

// The model picks a band; the server owns the number, so the face, ring and delta always agree.
const BAND_DELTAS: Record<Reaction, [number, number, number]> = {
  impressed: [8, 12, 16],
  neutral: [0, 2, 4],
  probing: [-2, 1, 4],
  skeptical: [-4, -8, -12],
}

export function deltaFor(reaction: Reaction, strength: 1 | 2 | 3) {
  return BAND_DELTAS[reaction][strength - 1]
}

export function normalizeReaction(value: unknown): Reaction {
  return value === 'impressed' || value === 'neutral' || value === 'probing' || value === 'skeptical' ? value : 'neutral'
}

export function normalizeStrength(value: unknown): 1 | 2 | 3 {
  const n = Math.round(Number(value))
  return n <= 1 ? 1 : n >= 3 ? 3 : 2
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()

// Evidence must be the student's real words. If the model paraphrased, fall back to the sentence that overlaps most.
export function verifyEvidence(answer: string, quote: string): { quote: string; verified: boolean } {
  const q = (quote || '').replace(/^["“]|["”]$/g, '').trim()
  if (q && norm(answer).includes(norm(q))) return { quote: q, verified: true }
  const sentences = answer.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean)
  if (sentences.length === 0) return { quote: answer.slice(0, 160), verified: false }
  const qTokens = new Set(norm(q).split(' ').filter(w => w.length > 2))
  let best = sentences[0]
  let bestScore = -1
  for (const s of sentences) {
    const score = norm(s).split(' ').filter(w => qTokens.has(w)).length
    if (score > bestScore) {
      best = s
      bestScore = score
    }
  }
  const words = best.split(/\s+/)
  return { quote: words.length > 28 ? `${words.slice(0, 28).join(' ')}…` : best, verified: false }
}

const STOP = new Set('the and for with that this from have into your about what when then them they their there were been also just like used using made make built'.split(' '))
const tokens = (s: string) => new Set(norm(s).split(' ').filter(w => w.length > 2 && !STOP.has(w)))

// Fallback when the model names no lines: pick the resume lines whose words the answer actually reused.
export function linesMentioned(answer: string, lines: { id: string; text: string }[], max = 2): string[] {
  const said = tokens(answer)
  return lines
    .map(l => ({ id: l.id, overlap: [...tokens(l.text)].filter(w => said.has(w)).length }))
    .filter(l => l.overlap >= 2)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, max)
    .map(l => l.id)
}

const openConcerns = (p: Interviewer) => p.concerns.filter(c => c.state === 'open')

export function completedTurns(session: SessionDoc) {
  return session.turns.filter(t => t.attempts.length > 0).length
}

// Whoever has the biggest unresolved doubt asks next. The last speaker is damped and anyone who hasn't
// spoken yet gets a boost, so everyone on the panel is heard before anyone asks twice.
export function selectNext(session: SessionDoc): { interviewer: Interviewer; concern: Concern } | null {
  const max = session.config.maxQuestionsPerInterviewer
  const lastSpeaker = session.turns[session.turns.length - 1]?.interviewerId
  const multi = session.panel.length > 1
  let best: { interviewer: Interviewer; concern: Concern; score: number } | null = null
  for (const p of session.panel) {
    const open = openConcerns(p)
    const left = max - p.questionsAsked
    if (open.length === 0 || left <= 0) continue
    const score =
      0.5 * (100 - p.confidence) +
      8 * open.length +
      10 * left +
      (multi && p.questionsAsked === 0 ? 15 : 0) -
      (multi && p.id === lastSpeaker ? 25 : 0)
    if (!best || score > best.score) best = { interviewer: p, concern: open[0], score }
  }
  return best ? { interviewer: best.interviewer, concern: best.concern } : null
}

export function shouldEnd(session: SessionDoc) {
  if (completedTurns(session) >= session.config.maxTurns) return true
  if (session.pendingFollowUp) return false
  return selectNext(session) === null
}

export function verdictFor(overall: number): VerdictLabel {
  if (overall >= 70) return 'Interview Ready'
  if (overall >= 40) return 'Almost There'
  return 'Keep Practicing'
}

export function computeStats(session: SessionDoc): Outcome['stats'] {
  const lines = session.resume.lines
  const tested = lines.filter(l => l.status !== 'untested')
  let biggestGain: Outcome['stats']['biggestGain'] = null
  let comeback: Outcome['stats']['comeback'] = null
  for (const t of session.turns) {
    for (const a of t.attempts) {
      if (a.result.scoreDelta > 0 && (!biggestGain || a.result.scoreDelta > biggestGain.delta)) {
        biggestGain = { turnId: t.id, interviewerId: t.interviewerId, delta: a.result.scoreDelta }
      }
    }
    const retry = t.attempts.length > 1 ? t.attempts[t.attempts.length - 1].result.scoreDelta : 0
    if (retry > 0 && (!comeback || retry > comeback.delta)) {
      comeback = { turnId: t.id, interviewerId: t.interviewerId, delta: retry }
    }
  }
  const byConfidence = [...session.panel].sort((a, b) => a.confidence - b.confidence || a.startConfidence - b.startConfidence)
  return {
    linesTotal: lines.length,
    linesTested: tested.length,
    linesDefended: lines.filter(l => l.status === 'green').length,
    linesPartial: lines.filter(l => l.status === 'yellow').length,
    linesShaky: lines.filter(l => l.status === 'red').length,
    biggestGain,
    comeback,
    toughestCritic: byConfidence[0]?.id ?? null,
    strongestDomain: byConfidence.length ? domainLabel(byConfidence[byConfidence.length - 1].domain) : null,
  }
}
