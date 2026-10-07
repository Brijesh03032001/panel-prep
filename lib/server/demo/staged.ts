import type { SessionDoc, VerdictLabel } from '../../types'
import { assembleDebrief, scriptCovers, type DebriefScript } from './debrief'
import { RYAN_DEBRIEF, ryanFixture } from './ryan'

// Staged runs: a known resume, uploaded through the normal live form, replays a prepared script so the pitch run
// is repeatable. The session stays live, so the screens look exactly like a real one, and any step the script
// doesn't cover (a different branch, a longer interview, a rematch) goes to the live model instead.

interface Staged {
  matches: (text: string) => boolean
  fixture: (key: string) => unknown
  debrief: DebriefScript
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ')

const STAGED: Record<string, Staged> = {
  ryan: {
    matches: text => norm(text).includes('ryan brooks') && norm(text).includes('shelflife'),
    fixture: ryanFixture,
    debrief: RYAN_DEBRIEF,
  },
}

export function stagedScenarioFor(resumeText: string): string | null {
  return Object.keys(STAGED).find(name => STAGED[name].matches(resumeText)) ?? null
}

export function stagedFixture(scenario: string, key: string): unknown {
  return STAGED[scenario]?.fixture(key)
}

// Roughly half of what the live model takes for each step, so the run keeps the rhythm of a real one.
const PAUSES: [string, number][] = [
  ['audit', 2400],
  ['panel', 1800],
  ['question:', 900],
  ['followup:', 1100],
  ['evaluate:', 1500],
  ['coach:', 1600],
  ['huddle', 1800],
]

export function stagedPause(key: string) {
  const base = PAUSES.find(([prefix]) => key.startsWith(prefix))?.[1] ?? 1000
  return new Promise(r => setTimeout(r, base + Math.random() * 400))
}

/** The scripted debrief when every answered question was on the script, else null (the live huddle takes over). */
export async function stagedDebrief(session: SessionDoc, label: VerdictLabel) {
  const staged = session.scenario ? STAGED[session.scenario] : null
  if (!staged || !scriptCovers(session, staged.debrief)) return null
  await stagedPause('huddle')
  return assembleDebrief(session, label, staged.debrief)
}
