import type { SessionDoc, Turn, VerdictLabel } from '../../types'

// A scripted run can end after any answer, so its huddle and coaching plan are assembled from the beats that
// actually happened, keyed by script beat and how many attempts the question took.

export interface DebriefBeat {
  line: string
  strongest: string
  takeaway: string
  practice: string
  drill: { title: string; prompt: string }
  coach: string
  /** What this answer cost, said to the student, for "What held you back". */
  held: string
  /** The one next step, when this turns out to be the weakest answer of the run. */
  next?: string
}

export interface UnaskedBeat {
  line: string
  takeaway: string
  practice: string
  drill: { title: string; prompt: string }
  topic: string
}

export interface DebriefScript {
  beats: Record<string, DebriefBeat>
  /** What a panelist who never got to ask would say, keyed by interviewer id. */
  unasked: Record<string, UnaskedBeat>
  closing: Record<VerdictLabel, string>
  closingEarly: Record<VerdictLabel, string>
}

const finalDelta = (t: Turn) => t.attempts[t.attempts.length - 1].result.scoreDelta
const join = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`)

/** True when every answered question of the session is a beat this script can debrief. */
export function scriptCovers(session: SessionDoc, script: DebriefScript) {
  const answered = session.turns.filter(t => t.attempts.length > 0)
  return (
    answered.length > 0 &&
    answered.every(t => t.script && (script.beats[`${t.script}:${t.attempts.length}`] ?? script.beats[`${t.script}:1`])) &&
    session.panel.every(p => answered.some(t => t.interviewerId === p.id) || script.unasked[p.id])
  )
}

export function assembleDebrief(session: SessionDoc, label: VerdictLabel, script: DebriefScript) {
  const { beats, unasked: UNASKED } = script
  const answered = session.turns.filter(t => t.attempts.length > 0)
  const beatOf = (t: Turn) => beats[`${t.script}:${t.attempts.length}`] ?? beats[`${t.script}:1`]
  const first = (id: string) => session.panel.find(p => p.id === id)!.name.split(' ')[0]
  const asked = session.panel.filter(p => answered.some(t => t.interviewerId === p.id))
  const unasked = session.panel.filter(p => !asked.includes(p))
  const turnsOf = (id: string) => answered.filter(t => t.interviewerId === id && beatOf(t))

  // One line per answer while the conversation is short; with more, each panelist's most telling moment.
  const featured = (id: string) => {
    const ts = turnsOf(id)
    return ts.find(t => t.attempts.length > 1 && finalDelta(t) > 0) ?? [...ts].sort((a, b) => finalDelta(b) - finalDelta(a))[0]
  }
  const order = [...asked].sort((a, b) => answered.findIndex(t => t.interviewerId === a.id) - answered.findIndex(t => t.interviewerId === b.id))
  const lineTurns = answered.length <= 3 ? answered.filter(beatOf) : order.map(p => featured(p.id)).filter(Boolean)
  const huddle = lineTurns.map(t => ({ interviewerId: t.interviewerId, line: beatOf(t).line }))
  for (const p of unasked) huddle.push({ interviewerId: p.id, line: UNASKED[p.id].line })
  const warmest = [...session.panel].sort((a, b) => b.confidence - a.confidence)[0]
  huddle.push({ interviewerId: warmest.id, line: (unasked.length ? script.closingEarly : script.closing)[label] })

  const comeback = answered.find(t => t.attempts.length > 1 && finalDelta(t) > 0)
  const ranked = [...answered].filter(beatOf).sort((a, b) => finalDelta(b) - finalDelta(a))
  const best = comeback ?? ranked[0]
  const shaky = [...ranked].reverse().filter(t => t !== best && ['probing', 'skeptical'].includes(t.attempts[t.attempts.length - 1].result.reaction))
  const weak = shaky.find(t => t.interviewerId !== best?.interviewerId) ?? shaky[0]
  const summary = [best && beatOf(best).coach, weak && beatOf(weak).coach]
  if (unasked.length) {
    summary.push(`You ended before ${join(unasked.map(p => first(p.id)))} got to ask, so start your next practice with ${join(unasked.map(p => UNASKED[p.id].topic))}.`)
  }

  const practice = [...ranked].reverse().map(t => beatOf(t).practice).concat(unasked.map(p => UNASKED[p.id].practice))
  const fallback = ['Answer out loud with one real example each time', 'Lead with the result, then how you got there', 'When followed up, say why, not just what']
  const topPractice = [...new Set([...practice, ...fallback])].slice(0, 3)

  const drills = session.panel
    .map(p => {
      const ts = turnsOf(p.id)
      const d = ts.length ? beatOf(ts[ts.length - 1]).drill : UNASKED[p.id].drill
      return { ...d, interviewerId: p.id }
    })
    .filter((d, i, all) => all.findIndex(x => x.title === d.title) === i)
    .slice(0, 3)

  const perInterviewer = session.panel.map(p => {
    const ts = turnsOf(p.id)
    if (!ts.length) return { interviewerId: p.id, takeaway: UNASKED[p.id].takeaway, strongest: '' }
    const top = [...ts].sort((a, b) => finalDelta(b) - finalDelta(a))[0]
    return { interviewerId: p.id, takeaway: beatOf(ts[ts.length - 1]).takeaway, strongest: finalDelta(top) > 0 ? beatOf(top).strongest : '' }
  })

  // Sam's note in three parts: the best moment, what cost the most, and the one thing to do next.
  const lowest = [...ranked].reverse()[0]
  const wentWell = best ? beatOf(best).coach : 'You showed up and answered under pressure, which is the hardest part to practice.'
  const heldBack = lowest && lowest !== best ? beatOf(lowest).held : best ? beatOf(best).held : ''
  const scripted = lowest && lowest !== best ? beatOf(lowest).next : undefined
  const nextStep =
    scripted ??
    (unasked.length
      ? `Prepare for the questions you didn't get to: ${join(unasked.map(p => UNASKED[p.id].topic))}. Start with this: ${UNASKED[unasked[0].id].practice.charAt(0).toLowerCase()}${UNASKED[unasked[0].id].practice.slice(1)}.`
      : `This week, ${topPractice[0].charAt(0).toLowerCase()}${topPractice[0].slice(1)}, out loud, in under a minute.`)

  return {
    huddle,
    coachSummary: summary.filter(Boolean).slice(0, 3).join(' '),
    coach: { wentWell, heldBack, nextStep },
    topPractice,
    drills,
    perInterviewer,
  }
}
