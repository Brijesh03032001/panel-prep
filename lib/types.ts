export type Mode = 'live' | 'demo'
export type Reaction = 'impressed' | 'neutral' | 'probing' | 'skeptical'
export type LineStatus = 'untested' | 'green' | 'yellow' | 'red'
export type LineFlag = 'strength' | 'gap' | 'shaky'
export type Seat = 0 | 1 | 2

/** The project, job or school a resume line sits under, so the resume can be shown the way it was written. */
export interface ResumeEntry {
  title: string
  detail: string | null
  date: string | null
}

export interface ResumeLine {
  id: string
  section: string
  entry?: ResumeEntry | null
  text: string
  flag: LineFlag | null
  flagNote: string | null
  status: LineStatus
  testedBy: string[]
  evidence: string | null
}

export interface MissingSkill {
  skill: string
  why: string
}

export interface Concern {
  id: string
  text: string
  lineIds: string[]
  state: 'open' | 'probed' | 'resolved'
  origin: 'audit' | 'answer'
}

export interface Interviewer {
  id: string
  seat: Seat
  name: string
  title: string
  domain: string
  color: string
  voice: string
  joinReason: string
  /** How they introduce themselves: who they are, never why they were picked for this student. */
  intro?: string
  lookingFor: string
  persona: string
  startConfidence: number
  confidence: number
  confidenceHistory: number[]
  reaction: Reaction
  concerns: Concern[]
  questionsAsked: number
}

export interface EvalResult {
  reaction: Reaction
  strength: 1 | 2 | 3
  scoreDelta: number
  confidenceAfter: number
  lineIds: string[]
  lineStatus: Exclude<LineStatus, 'untested'>
  evidenceQuote: string
  evidenceVerified: boolean
  feedback: string
  lookingFor: string
  criteriaMet: string[]
  criteriaMissed: string[]
  resolvedConcernIds: string[]
  crossResolved: { interviewerId: string; concernId: string }[]
  newConcern: string | null
}

/** Sam's Lifeline: what the answer lacked, and talking points built only from the student's own resume and words. */
export interface Coaching {
  encouragement: string
  missing: string[]
  outline: string[]
  tip: string
}

export interface Attempt {
  answer: string
  hint: string | null
  result: EvalResult
  at: number
}

export interface Turn {
  id: string
  index: number
  interviewerId: string
  concernId: string
  question: string
  kind: 'question' | 'follow-up'
  buildsOn: string | null
  /** The student's own words (verbatim) that this question picks up. */
  anchor: string | null
  attempts: Attempt[]
  hint: string | null
  coaching?: Coaching | null
  /** Demo only: names the scripted beat, so fixtures follow the path the presenter actually took. */
  script?: string | null
  /** Demo only: false where the script has no Lifeline for this question. */
  coachable?: boolean
  createdAt: number
}

export interface CurrentTurn {
  turnId: string
  stage: 'awaiting-answer' | 'awaiting-decision'
}

export interface HuddleLine {
  interviewerId: string
  line: string
}

export type VerdictLabel = 'Interview Ready' | 'Rising Star' | 'Keep Practicing'

export interface Outcome {
  verdict: {
    label: VerdictLabel
    overall: number
    perInterviewer: { interviewerId: string; start: number; final: number }[]
  }
  huddle: HuddleLine[]
  coachSummary: string
  /** Sam's note to the student, in three plain parts. Older sessions only have coachSummary. */
  coach?: { wentWell: string; heldBack: string; nextStep: string }
  topPractice: string[]
  drills: { title: string; prompt: string; interviewerId: string }[]
  perInterviewer: { interviewerId: string; takeaway: string; strongest: string }[]
  stats: {
    linesTotal: number
    linesTested: number
    linesDefended: number
    linesPartial: number
    linesShaky: number
    biggestGain: { turnId: string; interviewerId: string; delta: number } | null
    comeback: { turnId: string; interviewerId: string; delta: number } | null
    toughestCritic: string | null
    strongestDomain: string | null
  }
}

export interface SessionSetup {
  roleKey: string
  roleTitle: string
  level: string
  jobDescription: string | null
  sourceName: string | null
}

export interface SessionDoc {
  id: string
  kind: 'full' | 'rematch'
  parentId: string | null
  mode: Mode
  sample: boolean
  createdAt: number
  status: 'audited' | 'ready' | 'interviewing' | 'complete'
  config: { maxTurns: number; maxQuestionsPerInterviewer: number }
  setup: SessionSetup
  resume: { headline: string; lines: ResumeLine[]; missing: MissingSkill[]; title?: string | null }
  panel: Interviewer[]
  turns: Turn[]
  current: CurrentTurn | null
  lifeline: { used: boolean; turnId: string | null }
  outcome: Outcome | null
  /** The student ended the interview before every panelist asked both questions. */
  endedEarly?: boolean
  recap?: string | null
  /** Staged pitch run (see lib/server/demo/staged.ts): a known resume replays a script while the session stays live. */
  scenario?: string | null
}

export interface SessionSummary {
  id: string
  createdAt: number
  kind: SessionDoc['kind']
  mode: Mode
  sample: boolean
  roleTitle: string
  verdict: VerdictLabel | null
  overall: number | null
  domains: { domain: string; confidence: number }[]
}

export type AnswerEvent =
  | { type: 'result'; turnId: string; result: EvalResult; session: SessionDoc }
  | { type: 'decision'; session: SessionDoc }
  | { type: 'next'; turn: Turn; session: SessionDoc }
  | { type: 'end'; session: SessionDoc }
  | { type: 'error'; message: string }

export interface AppConfig {
  live: boolean
  tts: boolean
  stt: boolean
  provider: string | null
}
