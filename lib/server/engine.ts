import { randomUUID } from 'node:crypto'
import { DOMAINS, SEATS } from '../catalog'
import { demoDebrief, demoFixture } from './demo/maya'
import { stagedDebrief } from './demo/staged'
import { callJSON } from './llm'
import { auditPrompt, coachPrompt, evaluatePrompt, followUpPrompt, huddlePrompt, panelPrompt, questionPrompt } from './prompts'
import { saveSession } from './repo'
import {
  completedTurns,
  computeStats,
  deltaFor,
  followUpConcern,
  linesMentioned,
  normalizeReaction,
  normalizeStrength,
  planNext,
  verdictFor,
  verifyAnchor,
  verifyEvidence,
} from './scoring'
import type {
  Coaching,
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
const ctx = (s: SessionDoc) => ({ mode: s.mode, sessionId: s.id, scenario: s.scenario ?? null })

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

// Demo turns are named beats of Maya's script; live turns are keyed by interviewer and question number.
const beat = (s: SessionDoc, turn: Turn) => turn.script ?? `${turn.interviewerId}:${questionNumber(s, turn)}`

const answersOf = (s: SessionDoc) => s.turns.flatMap(t => t.attempts.map(a => a.answer))

// ─── Session creation: Resume Audit ──────────────────────────────────────────

interface AuditRaw {
  headline?: unknown
  lines?: { section?: unknown; entry?: { title?: unknown; detail?: unknown; date?: unknown } | null; text?: unknown; flag?: unknown; note?: unknown }[]
  title?: unknown
  missing?: { skill?: unknown; why?: unknown }[]
}

export async function createSession(input: { resumeText: string; setup: SessionSetup; mode: Mode; scenario?: string | null }) {
  const session: SessionDoc = {
    id: randomUUID(),
    kind: 'full',
    parentId: null,
    mode: input.mode,
    sample: false,
    createdAt: Date.now(),
    status: 'audited',
    // Every panelist asks twice: an opening question, then a follow-up on what the student actually said.
    config: { maxTurns: 6, maxQuestionsPerInterviewer: 2 },
    setup: input.setup,
    resume: { headline: '', lines: [], missing: [] },
    panel: [],
    turns: [],
    current: null,
    lifeline: { used: false, turnId: null },
    outcome: null,
    scenario: input.mode === 'live' ? input.scenario ?? null : null,
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
    .map(l => {
      const title = str(l.entry?.title, 90)
      const entry = title ? { title, detail: str(l.entry?.detail, 120) || null, date: str(l.entry?.date, 40) || null } : null
      return { section: str(l.section, 40) || 'Other', entry, text: str(l.text, 220), flag: l.flag, note: str(l.note, 80) }
    })
    .filter(l => l.text.length > 2)
    .slice(0, 24)
    .map((l, i): ResumeLine => {
      const flag = flags.includes(l.flag as LineFlag) ? (l.flag as LineFlag) : null
      return {
        id: `L${i + 1}`,
        section: l.section,
        entry: l.entry,
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
  // Only the scripted demo carries a name; live resumes never store the student's name.
  session.resume.title = input.mode === 'demo' ? str(raw.title, 60) || null : null
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
    intro?: unknown
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
      intro: str(p.intro, 240) || undefined,
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
  if (session.outcome) return { end: true }
  const move = planNext(session)
  if (!move) return { end: true }

  const interviewer = move.interviewer
  let concern: Concern
  let question: string
  let anchor: string | null = null
  let buildsOn: string | null = null
  let script: string | null = null

  if (move.kind === 'follow-up') {
    concern = followUpConcern(interviewer, move.after)
    const last = move.after.attempts[move.after.attempts.length - 1]
    const raw = await callJSON<{ question?: unknown; anchor?: unknown; script?: unknown }>(ctx(session), {
      key: `followup:${beat(session, move.after)}:${move.after.attempts.length}`,
      ...followUpPrompt(session, interviewer, move.after, concern),
    })
    question = str(raw.question, 400) || `You said "${last.answer.split(/\s+/).slice(0, 8).join(' ')}". Can you take me one level deeper on that?`
    anchor = verifyAnchor(str(raw.anchor, 200), [last.answer])
    script = str(raw.script, 40) || null
  } else {
    concern = move.concern
    const raw = await callJSON<{ question?: unknown; anchor?: unknown; concernId?: unknown; buildsOn?: unknown; script?: unknown }>(ctx(session), {
      key: `question:${interviewer.id}:${interviewer.questionsAsked + 1}`,
      ...questionPrompt(session, interviewer, concern),
    })
    const picked = interviewer.concerns.find(c => c.id === str(raw.concernId, 20) && c.state !== 'resolved')
    if (picked) concern = picked
    question = str(raw.question, 400) || `Tell me more about this: ${concern.text.toLowerCase()}.`
    anchor = verifyAnchor(str(raw.anchor, 200), answersOf(session))
    const bridge = str(raw.buildsOn, 40)
    buildsOn = bridge && session.panel.some(p => p.name.startsWith(bridge)) && !interviewer.name.startsWith(bridge) ? bridge : null
    script = str(raw.script, 40) || null
  }

  const turn: Turn = {
    id: `t${session.turns.length + 1}`,
    index: session.turns.length,
    interviewerId: interviewer.id,
    concernId: concern.id,
    question,
    kind: move.kind,
    buildsOn,
    anchor,
    attempts: [],
    hint: null,
    coaching: null,
    createdAt: Date.now(),
  }
  if (session.mode === 'demo') {
    turn.script = script
    turn.coachable = Boolean(demoFixture(`coach:${beat(session, turn)}`))
  } else if (session.scenario) {
    // A staged run names its beats too, so later fixtures follow the path actually taken.
    turn.script = script
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
    key: `evaluate:${beat(session, turn)}:${attemptNo}`,
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
  const coachable = session.mode !== 'demo' || turn.coachable !== false
  const offerLifeline = weak && !session.lifeline.used && attemptNo === 1 && !turn.hint && coachable
  session.current = offerLifeline ? { turnId: turn.id, stage: 'awaiting-decision' } : null

  await saveSession(session)
  return { result, decision: offerLifeline }
}

export async function moveOn(session: SessionDoc, turnId: string) {
  const turn = currentTurn(session)
  if (!turn || turn.id !== turnId || session.current?.stage !== 'awaiting-decision') {
    throw new EngineError('Nothing to move on from.', 409)
  }
  session.current = null
  await saveSession(session)
}

export async function applyLifeline(session: SessionDoc, turnId: string): Promise<Coaching> {
  const turn = currentTurn(session)
  if (!turn || turn.id !== turnId) throw new EngineError('That question is no longer active.', 409)
  if (session.lifeline.used) throw new EngineError('Your Lifeline is already used for this interview.', 409)
  if (session.mode === 'demo' && turn.coachable === false) throw new EngineError("In the demo, Sam's coaching is scripted for other questions.", 409)
  const interviewer = interviewerOf(session, turn.interviewerId)
  const concern = concernOf(interviewer, turn.concernId)
  const raw = await callJSON<{ encouragement?: unknown; missing?: unknown; outline?: unknown; tip?: unknown }>(ctx(session), {
    key: `coach:${beat(session, turn)}`,
    ...coachPrompt(session, interviewer, concern, turn),
  })
  const coaching: Coaching = {
    encouragement: str(raw.encouragement, 80) || 'You know more than that answer showed.',
    missing: arr<string>(raw.missing).map(m => str(m, 120)).filter(Boolean).slice(0, 2),
    outline: arr<string>(raw.outline).map(o => str(o, 200)).filter(Boolean).slice(0, 3),
    tip: str(raw.tip, 140),
  }
  if (!coaching.outline.length) coaching.outline = ['Walk through it step by step, using one concrete example from your own project.']
  turn.coaching = coaching
  // The evaluator reads the coaching as plain text, so it can tell owned answers from read-back talking points.
  turn.hint = [
    coaching.missing.length ? `What was missing: ${coaching.missing.join('; ')}.` : '',
    `Talking points: ${coaching.outline.map((o, i) => `${i + 1}) ${o}`).join(' ')}`,
  ]
    .filter(Boolean)
    .join(' ')
  session.lifeline = { used: true, turnId: turn.id }
  session.current = { turnId: turn.id, stage: 'awaiting-answer' }
  await saveSession(session)
  return coaching
}

// ─── Results ─────────────────────────────────────────────────────────────────

interface HuddleRaw {
  huddle?: { interviewerId?: unknown; line?: unknown }[]
  coachSummary?: unknown
  coach?: { wentWell?: unknown; heldBack?: unknown; nextStep?: unknown }
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
  if (completedTurns(session) === 0) throw new EngineError('Answer at least one question before the panel can deliberate.')
  session.endedEarly = planNext(session) !== null

  const overall = clamp(session.panel.reduce((sum, p) => sum + p.confidence, 0) / session.panel.length)
  const label = verdictFor(overall)
  // The demo can end after any answer, so its debrief is assembled from the beats that actually happened.
  // A staged run does the same while it stayed on script, and asks the live model otherwise.
  const staged = session.mode === 'demo' ? null : await stagedDebrief(session, label)
  const raw: HuddleRaw =
    session.mode === 'demo'
      ? demoDebrief(session, label)
      : (staged ?? (await callJSON<HuddleRaw>(ctx(session), { key: 'huddle', ...huddlePrompt(session, label, overall) })))
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
    coach:
      raw.coach && str(raw.coach.wentWell, 260)
        ? { wentWell: str(raw.coach.wentWell, 260), heldBack: str(raw.coach.heldBack, 260), nextStep: str(raw.coach.nextStep, 260) }
        : undefined,
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
    config: { maxTurns: 3, maxQuestionsPerInterviewer: 3 },
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
    lifeline: { used: false, turnId: null },
    outcome: null,
    endedEarly: false,
    recap: recap || null,
    // Rematches are always fully live, even after a staged run.
    scenario: null,
  }
  return saveSession(session)
}
