import { randomUUID } from 'node:crypto'
import { DOMAINS, SEATS } from '../catalog'
import { callJSON } from './llm'
import { auditPrompt, coachPrompt, evaluatePrompt, huddlePrompt, panelPrompt, questionPrompt } from './prompts'
import { saveSession } from './repo'
import {
  completedTurns,
  computeStats,
  deltaFor,
  linesMentioned,
  normalizeReaction,
  normalizeStrength,
  selectNext,
  shouldEnd,
  verdictFor,
  verifyEvidence,
} from './scoring'
import type {
  Concern,
  EvalResult,
  Interviewer,
  LineFlag,
  Mode,
  Outcome,
  ResumeLine,
  Seat,
  SessionDoc,
  SessionSetup,
  Turn,
} from '../types'

export class EngineError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

const str = (v: unknown, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const arr = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)))
const ctx = (s: SessionDoc) => ({ mode: s.mode, sessionId: s.id })

const interviewerOf = (s: SessionDoc, id: string) => {
  const p = s.panel.find(x => x.id === id)
  if (!p) throw new EngineError('Unknown interviewer')
  return p
}

const concernOf = (p: Interviewer, id: string) => {
  const c = p.concerns.find(x => x.id === id)
  if (!c) throw new EngineError('Unknown concern')
  return c
}

// Fixture keys are stable per interviewer, so demo replay doesn't depend on wall-clock order.
const questionNumber = (s: SessionDoc, turn: Turn) =>
  s.turns.filter(t => t.interviewerId === turn.interviewerId && t.index <= turn.index).length

// ─── Session creation: Resume Audit ──────────────────────────────────────────

interface AuditRaw {
  headline?: unknown
  lines?: { section?: unknown; text?: unknown; flag?: unknown; note?: unknown }[]
  missing?: { skill?: unknown; why?: unknown }[]
}

export async function createSession(input: { resumeText: string; setup: SessionSetup; mode: Mode }) {
  const session: SessionDoc = {
    id: randomUUID(),
    kind: 'full',
    parentId: null,
    mode: input.mode,
    sample: false,
    createdAt: Date.now(),
    status: 'audited',
    config: input.mode === 'demo' ? { maxTurns: 3, maxQuestionsPerInterviewer: 2 } : { maxTurns: 6, maxQuestionsPerInterviewer: 2 },
    setup: input.setup,
    resume: { headline: '', lines: [], missing: [] },
    panel: [],
    turns: [],
    current: null,
    pendingFollowUp: null,
    lifeline: { used: false, turnId: null },
    outcome: null,
  }

  const raw = await callJSON<AuditRaw>(ctx(session), {
    key: 'audit',
    ...auditPrompt({
      resumeText: input.resumeText,
      roleTitle: input.setup.roleTitle,
      level: input.setup.level,
      jobDescription: input.setup.jobDescription,
    }),
  })

  const flags: LineFlag[] = ['strength', 'gap', 'shaky']
  session.resume.lines = arr<NonNullable<AuditRaw['lines']>[number]>(raw.lines)
    .map(l => ({ section: str(l.section, 40) || 'Other', text: str(l.text, 220), flag: l.flag, note: str(l.note, 80) }))
    .filter(l => l.text.length > 2)
    .slice(0, 24)
    .map((l, i): ResumeLine => {
      const flag = flags.includes(l.flag as LineFlag) ? (l.flag as LineFlag) : null
      return {
        id: `L${i + 1}`,
        section: l.section,
        text: l.text,
        flag,
        flagNote: flag ? l.note || null : null,
        status: 'untested',
        testedBy: [],
        evidence: null,
      }
    })
  if (session.resume.lines.length < 3) throw new EngineError("We couldn't find enough resume content to build a panel from.", 422)
  session.resume.headline = str(raw.headline, 220)
  session.resume.missing = arr<NonNullable<AuditRaw['missing']>[number]>(raw.missing)
    .map(m => ({ skill: str(m.skill, 40), why: str(m.why, 160) }))
    .filter(m => m.skill)
    .slice(0, 3)

  return saveSession(session)
}

// ─── Panel Builder ───────────────────────────────────────────────────────────

interface PanelRaw {
  interviewers?: {
    domain?: unknown
    name?: unknown
    title?: unknown
    joinReason?: unknown
    lookingFor?: unknown
    persona?: unknown
    startConfidence?: unknown
    concerns?: { text?: unknown; lineIds?: unknown }[]
  }[]
}

export async function buildPanel(session: SessionDoc) {
  if (session.panel.length) return session
  const raw = await callJSON<PanelRaw>(ctx(session), { key: 'panel', ...panelPrompt(session) })
  const lineIds = new Set(session.resume.lines.map(l => l.id))
  const used = new Set<string>()
  const picks = arr<NonNullable<PanelRaw['interviewers']>[number]>(raw.interviewers).slice(0, 3)
  if (picks.length < 3) throw new EngineError('The panel builder returned an incomplete panel. Please try again.', 502)

  session.panel = picks.map((p, i): Interviewer => {
    const seat = i as Seat
    const id = `i${i}`
    let domain = str(p.domain, 30)
    if (!DOMAINS.some(d => d.key === domain) || used.has(domain)) {
      domain = DOMAINS.find(d => !used.has(d.key))!.key
    }
    used.add(domain)
    const start = clamp(Number(p.startConfidence) || 45, 20, 80)
    const concerns: Concern[] = arr<NonNullable<NonNullable<PanelRaw['interviewers']>[number]['concerns']>[number]>(p.concerns)
      .map(c => ({ text: str(c.text, 140), lineIds: arr<string>(c.lineIds).filter(x => lineIds.has(x)).slice(0, 3) }))
      .filter(c => c.text)
      .slice(0, 3)
      .map((c, n) => ({ id: `${id}c${n}`, text: c.text, lineIds: c.lineIds, state: 'open', origin: 'audit' }))
    return {
      id,
      seat,
      name: str(p.name, 60) || ['Priya Raman', 'Leo Park', 'Marcus Hale'][i],
      title: str(p.title, 60) || DOMAINS.find(d => d.key === domain)!.label,
      domain,
      color: SEATS[seat].color,
      voice: SEATS[seat].voice,
      joinReason: str(p.joinReason, 200),
      lookingFor: str(p.lookingFor, 240),
      persona: str(p.persona, 900),
      startConfidence: start,
      confidence: start,
      confidenceHistory: [start],
      reaction: 'neutral',
      concerns,
      questionsAsked: 0,
    }
  })
  session.status = 'ready'
  return saveSession(session)
}

// ─── Turns ───────────────────────────────────────────────────────────────────

export function currentTurn(session: SessionDoc) {
  return session.current ? session.turns.find(t => t.id === session.current!.turnId) ?? null : null
}

export async function startTurn(session: SessionDoc): Promise<{ turn: Turn } | { end: true }> {
  const existing = currentTurn(session)
  if (existing) return { turn: existing }
  if (session.outcome || shouldEnd(session)) return { end: true }

  let interviewer: Interviewer
  let concern: Concern
  let question: string
  let buildsOn: string | null = null
  let kind: Turn['kind'] = 'question'

  if (session.pendingFollowUp) {
    interviewer = interviewerOf(session, session.pendingFollowUp.interviewerId)
    concern = concernOf(interviewer, session.pendingFollowUp.concernId)
    question = session.pendingFollowUp.question
    kind = 'follow-up'
    session.pendingFollowUp = null
  } else {
    const next = selectNext(session)
    if (!next) return { end: true }
    interviewer = next.interviewer
    concern = next.concern
    const raw = await callJSON<{ question?: unknown; buildsOn?: unknown }>(ctx(session), {
      key: `question:${interviewer.id}:${interviewer.questionsAsked + 1}`,
      ...questionPrompt(session, interviewer, concern),
    })
    question = str(raw.question, 400) || `Tell me more about this: ${concern.text.toLowerCase()}.`
    const bridge = str(raw.buildsOn, 40)
    buildsOn = bridge && session.panel.some(p => p.name.startsWith(bridge)) && !interviewer.name.startsWith(bridge) ? bridge : null
  }

  const turn: Turn = {
    id: `t${session.turns.length + 1}`,
    index: session.turns.length,
    interviewerId: interviewer.id,
    concernId: concern.id,
    question,
    kind,
    buildsOn,
    attempts: [],
    hint: null,
    createdAt: Date.now(),
  }
  interviewer.questionsAsked += 1
  session.turns.push(turn)
  session.current = { turnId: turn.id, stage: 'awaiting-answer' }
  session.status = 'interviewing'
  await saveSession(session)
  return { turn }
}

interface EvalRaw {
  band?: unknown
  strength?: unknown
  criteriaMet?: unknown
  criteriaMissed?: unknown
  lineIds?: unknown
  lineStatus?: unknown
  evidenceQuote?: unknown
  feedback?: unknown
  lookingFor?: unknown
  resolvesActiveConcern?: unknown
  crossResolved?: unknown
  newConcern?: unknown
  followUp?: unknown
}

export async function submitAnswer(session: SessionDoc, turnId: string, answerText: string) {
  const turn = currentTurn(session)
  if (!turn || turn.id !== turnId) throw new EngineError('That question is no longer active.', 409)
  if (session.current?.stage !== 'awaiting-answer') throw new EngineError('Choose whether to use your Lifeline or move on first.', 409)
  const answer = answerText.trim().slice(0, 4000)
  if (answer.length < 2) throw new EngineError('Say or type an answer first.')

  const interviewer = interviewerOf(session, turn.interviewerId)
  const concern = concernOf(interviewer, turn.concernId)
  const attemptNo = turn.attempts.length + 1
  const hint = turn.hint

  const raw = await callJSON<EvalRaw>(ctx(session), {
    key: `evaluate:${interviewer.id}:${questionNumber(session, turn)}:${attemptNo}`,
    ...evaluatePrompt(session, interviewer, concern, turn, answer, hint),
  })

  const reaction = normalizeReaction(raw.band)
  const strength = normalizeStrength(raw.strength)
  const scoreDelta = deltaFor(reaction, strength)
  const knownLines = new Set(session.resume.lines.map(l => l.id))
  let lineIds = arr<string>(raw.lineIds).filter(id => knownLines.has(id)).slice(0, 3)
  if (lineIds.length === 0) lineIds = concern.lineIds.slice(0, 3)
  if (lineIds.length === 0) lineIds = linesMentioned(answer, session.resume.lines)
  const modelStatus = raw.lineStatus === 'green' || raw.lineStatus === 'yellow' || raw.lineStatus === 'red' ? raw.lineStatus : 'yellow'
  const lineStatus = reaction === 'impressed' ? 'green' : reaction === 'skeptical' ? 'red' : modelStatus === 'red' ? 'yellow' : modelStatus
  const evidence = verifyEvidence(answer, str(raw.evidenceQuote, 400))
  const positive = reaction === 'impressed' || reaction === 'neutral'

  const otherConcernIds = new Map<string, string>()
  session.panel.forEach(p => p.id !== interviewer.id && p.concerns.forEach(c => c.state !== 'resolved' && otherConcernIds.set(c.id, p.id)))
  const crossResolved = positive
    ? arr<{ concernId?: unknown }>(raw.crossResolved)
        .map(c => str(c?.concernId, 20))
        .filter(id => otherConcernIds.has(id))
        .map(concernId => ({ interviewerId: otherConcernIds.get(concernId)!, concernId }))
    : []

  const resolves = raw.resolvesActiveConcern === true && positive
  const result: EvalResult = {
    reaction,
    strength,
    scoreDelta,
    confidenceAfter: clamp(interviewer.confidence + scoreDelta),
    lineIds,
    lineStatus,
    evidenceQuote: evidence.quote,
    evidenceVerified: evidence.verified,
    feedback: str(raw.feedback, 400),
    lookingFor: str(raw.lookingFor, 300) || interviewer.lookingFor,
    criteriaMet: arr<string>(raw.criteriaMet).map(c => str(c, 60)).filter(Boolean).slice(0, 3),
    criteriaMissed: arr<string>(raw.criteriaMissed).map(c => str(c, 60)).filter(Boolean).slice(0, 3),
    resolvedConcernIds: resolves ? [concern.id] : [],
    crossResolved,
    newConcern: str(raw.newConcern, 140) || null,
    followUp: reaction === 'probing' ? str(raw.followUp, 240) || null : null,
  }

  interviewer.confidence = result.confidenceAfter
  interviewer.confidenceHistory.push(result.confidenceAfter)
  interviewer.reaction = reaction
  if (resolves) concern.state = 'resolved'
  else if (concern.state === 'open') concern.state = 'probed'
  for (const cr of crossResolved) concernOf(interviewerOf(session, cr.interviewerId), cr.concernId).state = 'resolved'
  if (result.newConcern && interviewer.concerns.length < 5 && completedTurns(session) < session.config.maxTurns - 1) {
    interviewer.concerns.push({ id: `${interviewer.id}c${interviewer.concerns.length}`, text: result.newConcern, lineIds, state: 'open', origin: 'answer' })
  }
  for (const line of session.resume.lines) {
    if (!lineIds.includes(line.id)) continue
    line.status = lineStatus
    line.evidence = evidence.quote
    if (!line.testedBy.includes(interviewer.id)) line.testedBy.push(interviewer.id)
  }
  turn.attempts.push({ answer, hint, result, at: Date.now() })

  const weak = reaction === 'skeptical' || reaction === 'probing'
  const offerLifeline = weak && !session.lifeline.used && attemptNo === 1
  if (offerLifeline) session.current = { turnId: turn.id, stage: 'awaiting-decision' }
  else completeTurn(session, turn, interviewer, result)

  await saveSession(session)
  return { result, decision: offerLifeline }
}

function completeTurn(session: SessionDoc, turn: Turn, interviewer: Interviewer, result: EvalResult) {
  session.current = null
  const canFollowUp =
    result.followUp &&
    turn.kind !== 'follow-up' &&
    interviewer.questionsAsked < session.config.maxQuestionsPerInterviewer &&
    completedTurns(session) < session.config.maxTurns
  session.pendingFollowUp = canFollowUp ? { interviewerId: interviewer.id, concernId: turn.concernId, question: result.followUp! } : null
}

export async function moveOn(session: SessionDoc, turnId: string) {
  const turn = currentTurn(session)
  if (!turn || turn.id !== turnId || session.current?.stage !== 'awaiting-decision') {
    throw new EngineError('Nothing to move on from.', 409)
  }
  const last = turn.attempts[turn.attempts.length - 1]
  completeTurn(session, turn, interviewerOf(session, turn.interviewerId), last.result)
  await saveSession(session)
}

export async function applyLifeline(session: SessionDoc, turnId: string) {
  const turn = currentTurn(session)
  if (!turn || turn.id !== turnId) throw new EngineError('That question is no longer active.', 409)
  if (session.lifeline.used) throw new EngineError('Your Lifeline is already used for this interview.', 409)
  const interviewer = interviewerOf(session, turn.interviewerId)
  const concern = concernOf(interviewer, turn.concernId)
  const raw = await callJSON<{ encouragement?: unknown; hint?: unknown }>(ctx(session), {
    key: `coach:${interviewer.id}:${questionNumber(session, turn)}`,
    ...coachPrompt(session, interviewer, concern, turn),
  })
  const encouragement = str(raw.encouragement, 80)
  const hint = str(raw.hint, 400) || 'Slow down and walk through it step by step, using one concrete example from your own project.'
  turn.hint = hint
  session.lifeline = { used: true, turnId: turn.id }
  session.current = { turnId: turn.id, stage: 'awaiting-answer' }
  await saveSession(session)
  return { encouragement, hint }
}

// ─── Verdict ─────────────────────────────────────────────────────────────────

interface HuddleRaw {
  huddle?: { interviewerId?: unknown; line?: unknown }[]
  coachSummary?: unknown
  topPractice?: unknown
  drills?: { title?: unknown; prompt?: unknown; interviewerId?: unknown }[]
  perInterviewer?: { interviewerId?: unknown; takeaway?: unknown; strongest?: unknown }[]
}

export async function finish(session: SessionDoc) {
  if (session.outcome) return session
  const open = currentTurn(session)
  if (open && open.attempts.length === 0) {
    session.turns = session.turns.filter(t => t.id !== open.id)
    interviewerOf(session, open.interviewerId).questionsAsked -= 1
  }
  session.current = null
  session.pendingFollowUp = null
  if (completedTurns(session) === 0) throw new EngineError('Answer at least one question before the panel can deliberate.')

  const overall = clamp(session.panel.reduce((sum, p) => sum + p.confidence, 0) / session.panel.length)
  const label = verdictFor(overall)
  const raw = await callJSON<HuddleRaw>(ctx(session), { key: 'huddle', ...huddlePrompt(session, label, overall) })
  const ids = new Set(session.panel.map(p => p.id))
  const pick = (v: unknown) => (ids.has(str(v, 10)) ? str(v, 10) : session.panel[0].id)

  const outcome: Outcome = {
    verdict: {
      label,
      overall,
      perInterviewer: session.panel.map(p => ({ interviewerId: p.id, start: p.startConfidence, final: p.confidence })),
    },
    huddle: arr<NonNullable<HuddleRaw['huddle']>[number]>(raw.huddle)
      .map(h => ({ interviewerId: pick(h.interviewerId), line: str(h.line, 220) }))
      .filter(h => h.line)
      .slice(0, 6),
    coachSummary: str(raw.coachSummary, 600),
    topPractice: arr<string>(raw.topPractice).map(t => str(t, 120)).filter(Boolean).slice(0, 3),
    drills: arr<NonNullable<HuddleRaw['drills']>[number]>(raw.drills)
      .map(d => ({ title: str(d.title, 60), prompt: str(d.prompt, 240), interviewerId: pick(d.interviewerId) }))
      .filter(d => d.title && d.prompt)
      .slice(0, 3),
    perInterviewer: session.panel.map(p => {
      const hit = arr<NonNullable<HuddleRaw['perInterviewer']>[number]>(raw.perInterviewer).find(x => str(x.interviewerId, 10) === p.id)
      return { interviewerId: p.id, takeaway: str(hit?.takeaway, 240), strongest: str(hit?.strongest, 120) }
    }),
    stats: computeStats(session),
  }
  session.outcome = outcome
  session.status = 'complete'
  return saveSession(session)
}

// ─── The Comeback: rematch one interviewer ───────────────────────────────────

export async function createRematch(parent: SessionDoc, interviewerId: string) {
  const source = interviewerOf(parent, interviewerId)
  let concerns = source.concerns.filter(c => c.state !== 'resolved')
  if (concerns.length === 0) throw new EngineError(`${source.name.split(' ')[0]} is already convinced. Pick someone who still has doubts.`)
  concerns = concerns.map(c => ({ ...c, state: 'open' }))
  const recap = parent.turns
    .filter(t => t.interviewerId === interviewerId && t.attempts.length)
    .map(t => {
      const last = t.attempts[t.attempts.length - 1]
      return `You asked: "${t.question}" They answered: "${last.answer.slice(0, 400)}" Still missing: ${last.result.criteriaMissed.join('; ') || 'depth'}.`
    })
    .join('\n')
  const session: SessionDoc = {
    ...structuredClone(parent),
    id: randomUUID(),
    kind: 'rematch',
    parentId: parent.id,
    mode: 'live',
    sample: false,
    createdAt: Date.now(),
    status: 'ready',
    config: { maxTurns: Math.min(3, concerns.length + 1), maxQuestionsPerInterviewer: 3 },
    panel: [
      {
        ...structuredClone(source),
        startConfidence: source.confidence,
        confidenceHistory: [source.confidence],
        reaction: 'neutral',
        concerns,
        questionsAsked: 0,
      },
    ],
    turns: [],
    current: null,
    pendingFollowUp: null,
    lifeline: { used: false, turnId: null },
    outcome: null,
    recap: recap || null,
  }
  return saveSession(session)
}
