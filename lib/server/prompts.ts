import { DOMAINS, SEATS } from '../catalog'
import type { Concern, Interviewer, ResumeLine, SessionDoc, Turn } from '../types'

const PRINCIPLES = `You are part of Panel Prep, a practice tool that helps university students learn to defend their own work in technical interviews.
Principles you must follow:
- Pressure, not punishment: be rigorous and curious, never hostile, sarcastic or demeaning.
- Judge substance only. Ignore grammar, accents, filler words and speech-to-text transcription errors. Many students are first-generation, international, online or career-changers.
- Ground everything in the student's actual resume. Never invent experience they didn't claim.
- Plain spoken English. Questions are read aloud, so keep them short and natural.
- Output a single valid JSON object exactly matching the requested shape.`

const fmtLines = (lines: ResumeLine[]) =>
  lines.map(l => `[${l.id}] (${l.section}) ${l.text}${l.flag ? `  <-- ${l.flag}: ${l.flagNote ?? ''}` : ''}`).join('\n')

const fmtTarget = (s: SessionDoc) =>
  `Target role: ${s.setup.level} ${s.setup.roleTitle}${s.setup.jobDescription ? `\nJob description:\n"""${s.setup.jobDescription.slice(0, 3000)}"""` : ''}`

export function auditPrompt(input: { resumeText: string; roleTitle: string; level: string; jobDescription: string | null }) {
  return {
    system: `${PRINCIPLES}\n\nYou are the Resume Auditor. You split a resume into individual claims and flag the ones an interviewer would challenge.`,
    prompt: `Target role: ${input.level} ${input.roleTitle}
${input.jobDescription ? `Job description:\n"""${input.jobDescription.slice(0, 3000)}"""\n` : ''}
Resume text (contact details already removed):
"""
${input.resumeText}
"""

Tasks:
1. Split the resume into individual lines a student could be asked about: one bullet or claim per line. Copy the wording verbatim (you may join a bullet that wrapped across lines). Skip the student's name, contact info, headers, dates-only lines and filler. Keep skills lines as they appear. Maximum 24 lines, each under 170 characters. Label each with its section (Education, Experience, Projects, Skills, Leadership, Research, or Other).
2. Flag at most 7 lines:
   - "strength": specific, relevant to the target role, and clearly owned by the student.
   - "gap": relevant to the role but missing the how or why (e.g. "Deployed on AWS" with no detail of how).
   - "shaky": vague, inflated or ambiguous ownership (e.g. "Built a scalable backend", "worked in a team of 4").
   Give each flag a note of at most 9 words, written as what an interviewer would notice.
3. List up to 3 skills the target role clearly needs that the resume never mentions.
4. Write a one-sentence headline (max 22 words) summarizing how this resume reads for the role, honest and encouraging.

Return JSON:
{
  "headline": "...",
  "lines": [{ "section": "Projects", "text": "...", "flag": "gap" | "strength" | "shaky" | null, "note": "..." | null }],
  "missing": [{ "skill": "Testing", "why": "..." }]
}`,
    temperature: 0.2,
  }
}

export function panelPrompt(session: SessionDoc) {
  const pool = DOMAINS.map(d => `- ${d.key}: ${d.label} (${d.focus})`).join('\n')
  return {
    system: `${PRINCIPLES}\n\nYou are the Panel Builder. You choose the three interviewers who will reveal the most about whether this student can defend their resume for this role.`,
    prompt: `${fmtTarget(session)}

Audit headline: ${session.resume.headline}
Resume lines:
${fmtLines(session.resume.lines)}
Skills the role needs that the resume never mentions: ${session.resume.missing.map(m => m.skill).join(', ') || 'none'}

Domain pool (use these keys):
${pool}

Choose exactly 3 interviewers with 3 different domains:
- At least one core domain for the target role.
- The others where this resume is weakest: flagged gaps, shaky claims, or missing skills the role needs.
- At most one "behavioral".

The panel artwork is fixed, so interviewer 1 is ${SEATS[0].presentation}, interviewer 2 is ${SEATS[1].presentation}, interviewer 3 is ${SEATS[2].presentation}. Give each a realistic, culturally varied full name that fits.

For each interviewer:
- "domain": key from the pool.
- "title": short job title, e.g. "Frontend Lead", "DevOps Engineer".
- "joinReason": one sentence, max 18 words, second person, pointing at a specific resume line or missing skill. e.g. "Your resume mentions AWS but never how the site actually gets deployed."
- "lookingFor": one sentence on what a strong candidate shows in this domain.
- "persona": 3 sentences in second person describing how you interview: what you probe, your style (rigorous, fair, curious), and what convinces you.
- "startConfidence": integer 25-75, how convinced you are before the interview, calibrated to the evidence in the resume for your domain. Do not default to 50.
- "concerns": exactly 3 doubts you want to resolve, phrased as short noun clauses (not questions), each with the lineIds it relates to ([] if it is about a missing skill). e.g. { "text": "Deployment process never explained", "lineIds": ["L4"] }

Return JSON:
{ "interviewers": [{ "domain": "...", "name": "...", "title": "...", "joinReason": "...", "lookingFor": "...", "persona": "...", "startConfidence": 40, "concerns": [{ "text": "...", "lineIds": ["L1"] }] }] }`,
    temperature: 0.5,
  }
}

function transcript(session: SessionDoc, limit = 4) {
  const name = (id: string) => session.panel.find(p => p.id === id)?.name.split(' ')[0] ?? 'Interviewer'
  const done = session.turns.filter(t => t.attempts.length > 0).slice(-limit)
  if (done.length === 0) return '(This is the first question of the interview.)'
  return done
    .map(t => {
      const last = t.attempts[t.attempts.length - 1]
      return `${name(t.interviewerId)} asked: ${t.question}\nStudent answered: ${last.answer.slice(0, 600)}\n(${name(t.interviewerId)} was ${last.result.reaction})`
    })
    .join('\n\n')
}

export function questionPrompt(session: SessionDoc, interviewer: Interviewer, concern: Concern) {
  const lines = session.resume.lines.filter(l => concern.lineIds.includes(l.id))
  const prev = [...session.turns].reverse().find(t => t.attempts.length > 0)
  const prevSpeaker = prev && prev.interviewerId !== interviewer.id ? session.panel.find(p => p.id === prev.interviewerId) : null
  return {
    system: `${PRINCIPLES}\n\nYou are ${interviewer.name}, ${interviewer.title}, on a three-person interview panel.\n${interviewer.persona}`,
    prompt: `${fmtTarget(session)}

The doubt you want to resolve now: "${concern.text}"
Resume lines it relates to:
${lines.length ? fmtLines(lines) : '(a skill the role needs that the resume never mentions)'}

Conversation so far:
${transcript(session)}
${session.recap ? `\nThis is a rematch: the student asked to face you again after practicing. Your earlier exchange:\n${session.recap}\nDon't repeat an earlier question. Ask about what they still hadn't shown, and acknowledge it's a second round if natural.\n` : ''}
Ask the student ONE question that tests this doubt.
- Max 2 short sentences, max 40 words, natural spoken English.
- Reference their resume in your own words ("You wrote that you...") when it helps.
- Ask for how or why, not trivia or definitions.
- No multi-part lists, no preamble, no repeating what was already asked.
${prevSpeaker ? `- If it is genuinely connected to the last answer, you may open with a short bridge to it, e.g. "Building on what you told ${prevSpeaker.name.split(' ')[0]}, ..." Only do this if it is relevant.` : ''}

Return JSON: { "question": "...", "buildsOn": ${prevSpeaker ? `"${prevSpeaker.name.split(' ')[0]}" or null` : 'null'} }`,
    temperature: 0.6,
  }
}

export function evaluatePrompt(
  session: SessionDoc,
  interviewer: Interviewer,
  concern: Concern,
  turn: Turn,
  answer: string,
  hint: string | null,
) {
  const others = session.panel
    .filter(p => p.id !== interviewer.id)
    .flatMap(p => p.concerns.filter(c => c.state !== 'resolved').map(c => `- [${c.id}] ${p.name.split(' ')[0]}: ${c.text}`))
  return {
    system: `${PRINCIPLES}\n\nYou are ${interviewer.name}, ${interviewer.title}, evaluating one answer.\n${interviewer.persona}`,
    prompt: `${fmtTarget(session)}

Resume lines:
${fmtLines(session.resume.lines)}

Your doubt: [${concern.id}] "${concern.text}"
What a strong candidate shows: ${interviewer.lookingFor}

Question you asked: "${turn.question}"
${hint ? `The student used their one Lifeline. The coach's hint was: "${hint}". This is their second attempt; judge the improved answer on its merits.` : ''}
Student's answer (may be a speech transcript):
"""${answer}"""

Other panelists' open doubts (ids you may mark as also resolved):
${others.length ? others.join('\n') : '(none)'}

Evaluate the answer, calibrated to the target level (${session.setup.level}). Judge it against what a strong ${session.setup.level.toLowerCase()} candidate would say, not a senior engineer. A spoken answer doesn't need to be exhaustive to be excellent.
- "band":
  "impressed" = concrete and correct for the level, explains how or why, uses their own example or a clear plan. Missing a minor detail is still impressed.
  "neutral" = acceptable but generic; neither raises nor lowers your view much.
  "probing" = partly right but missing the key how or why; you'd want to dig deeper.
  "skeptical" = vague, incorrect, evasive, or contradicts the resume.
${hint ? '- After a Lifeline, if the second attempt now addresses the core of your doubt, choose "impressed" or "neutral"; reserve "probing" for retries that still miss the main point.' : ''}
- "strength": 1, 2 or 3, how strongly the answer fits that band.
- "criteriaMet" / "criteriaMissed": up to 3 short phrases each (max 6 words) describing what the answer did or did not show.
- "lineIds": 1-3 resume line ids (quoted strings like "L2") whose work this answer drew on. If your doubt is about a skill the resume never mentions, pick the lines for the project or job the student talked about. Only return [] if the answer mentioned nothing from the resume.
- "lineStatus": "green" if those lines are now defended, "yellow" if partly, "red" if not.
- "evidenceQuote": copy, word for word, the 6-25 words from the student's answer that most drove your judgment.
- "feedback": 1-2 sentences to the student, specific and kind, naming what to strengthen. Never give a model answer.
- "lookingFor": one sentence on what a strong answer would have included, described as qualities, not a script.
- "resolvesActiveConcern": true only if your doubt is now genuinely resolved.
- "crossResolved": other panelists' doubt ids this answer clearly resolved too (rare).
- "newConcern": a new doubt this answer revealed, as a short noun clause, or null.
- "followUp": only if band is "probing": one short go-deeper question (max 25 words) that would reveal real understanding. Otherwise null.

Return JSON:
{ "band": "probing", "strength": 2, "criteriaMet": [], "criteriaMissed": [], "lineIds": [], "lineStatus": "yellow", "evidenceQuote": "...", "feedback": "...", "lookingFor": "...", "resolvesActiveConcern": false, "crossResolved": [{ "concernId": "..." }], "newConcern": null, "followUp": null }`,
    temperature: 0.2,
  }
}

export function coachPrompt(session: SessionDoc, interviewer: Interviewer, concern: Concern, turn: Turn) {
  const last = turn.attempts[turn.attempts.length - 1]
  return {
    system: `${PRINCIPLES}\n\nYou are Sam, the student's coach. You sit beside the student, fully on their side. You never give answers: research shows students who get answers from AI learn less than students who get hints.`,
    prompt: `${fmtTarget(session)}

${interviewer.name.split(' ')[0]} (${interviewer.title}) asked: "${turn.question}"
Their doubt: "${concern.text}"
${last ? `The student's first attempt: """${last.answer}"""\nWhat it was missing: ${last.result.criteriaMissed.join('; ') || 'depth and specifics'}` : 'The student asked for help before answering.'}

Give ONE hint that helps the student find the answer themselves.
- Point to a way of structuring the answer (steps, before/after, a trade-off, a concrete example from their own project) or ask a guiding question.
- Do NOT name the specific technologies, terms or facts they should say, unless the student already said them.
- Max 45 words. Warm, calm, encouraging.
- "encouragement": a 3-8 word opener, e.g. "You know more than that answer showed."

Return JSON: { "encouragement": "...", "hint": "..." }`,
    temperature: 0.5,
  }
}

export function huddlePrompt(session: SessionDoc, verdictLabel: string, overall: number) {
  const panel = session.panel
    .map(p => {
      const resolved = p.concerns.filter(c => c.state === 'resolved').map(c => c.text)
      const open = p.concerns.filter(c => c.state !== 'resolved').map(c => c.text)
      return `[${p.id}] ${p.name} (${p.title}): confidence ${p.startConfidence} -> ${p.confidence}. Resolved: ${resolved.join('; ') || 'none'}. Still unconvinced: ${open.join('; ') || 'nothing'}.`
    })
    .join('\n')
  const moments = session.turns
    .filter(t => t.attempts.length)
    .map(t => {
      const last = t.attempts[t.attempts.length - 1]
      const who = session.panel.find(p => p.id === t.interviewerId)?.name.split(' ')[0]
      return `${who} asked "${t.question}" -> ${last.result.reaction} (${last.result.scoreDelta >= 0 ? '+' : ''}${last.result.scoreDelta}${t.attempts.length > 1 ? ', after a Lifeline retry' : ''}). Evidence: "${last.result.evidenceQuote}"`
    })
    .join('\n')
  return {
    system: `${PRINCIPLES}\n\nYou write the panel's closing deliberation and the coach's debrief. The verdict is already decided by the scores: ${verdictLabel} (${overall}%). Never use the word "rejected". In the huddle, refer to the student as "they" or "the candidate".`,
    prompt: `${fmtTarget(session)}

Panel:
${panel}

Moments:
${moments || '(no answers)'}

Write:
1. "huddle": 4-6 short lines of the three interviewers conferring, like judges talking among themselves. Each line max 22 words, refers to a specific moment or doubt, and they can respond to each other. Use the interviewer ids above.
2. "coachSummary": Sam's 2-3 sentence debrief to the student, in plain, honest, encouraging words.
3. "topPractice": exactly 3 things to practice this week, imperative, max 12 words each.
4. "drills": exactly 3 sixty-second speaking drills, each { "title": max 6 words, "prompt": one sentence starting with a verb, "interviewerId": who would ask it }.
5. "perInterviewer": one entry per interviewer { "interviewerId", "takeaway": max 25 words, direct and actionable, "strongest": max 12 words, the best thing the student showed them }.

Return JSON:
{ "huddle": [{ "interviewerId": "i0", "line": "..." }], "coachSummary": "...", "topPractice": ["..."], "drills": [{ "title": "...", "prompt": "...", "interviewerId": "i0" }], "perInterviewer": [{ "interviewerId": "i0", "takeaway": "...", "strongest": "..." }] }`,
    temperature: 0.6,
  }
}
