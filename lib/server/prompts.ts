import { DOMAINS, SEATS } from '../catalog'
import type { Concern, Interviewer, ResumeLine, SessionDoc, Turn } from '../types'

const PRINCIPLES = `You are part of Mockify, a practice tool that helps university students learn to defend their own work in technical interviews.
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
   Give each line the "entry" it sits under, exactly as the resume names it, so the resume can be shown as written: { "title": the project, job title or school, "detail": the organization, degree or tech stack line beside it (or null), "date": its dates as written (or null) }. Lines under the same project or job share the same entry. Skills lines have entry null.
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
  "lines": [{ "section": "Projects", "entry": { "title": "StudyBuddy", "detail": "React, Firebase", "date": "Spring 2025" } | null, "text": "...", "flag": "gap" | "strength" | "shaky" | null, "note": "..." | null }],
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
- "intro": how you introduce yourself at the start of the interview, first person, 1-2 sentences, max 32 words: your name, your role, and your background. Like a real interviewer, never mention the student's resume or why you were chosen. e.g. "Hi, I'm Marcus Hale, a DevOps engineer. I run our deployment pipelines and keep our sites fast and online."
- "joinReason": one sentence, max 18 words, second person, pointing at a specific resume line or missing skill. Private to the panel, never said out loud. e.g. "Your resume mentions AWS but never how the site actually gets deployed."
- "lookingFor": one sentence on what a strong candidate shows in this domain.
- "persona": 3 sentences in second person describing how you interview: what you probe, your style (rigorous, fair, curious), and what convinces you.
- "startConfidence": integer 25-75, how convinced you are before the interview, calibrated to the evidence in the resume for your domain. Do not default to 50.
- "concerns": exactly 3 doubts you want to resolve, phrased as short noun clauses (not questions), each with the lineIds it relates to ([] if it is about a missing skill). e.g. { "text": "Deployment process never explained", "lineIds": ["L4"] }

Return JSON:
{ "interviewers": [{ "domain": "...", "name": "...", "title": "...", "intro": "...", "joinReason": "...", "lookingFor": "...", "persona": "...", "startConfidence": 40, "concerns": [{ "text": "...", "lineIds": ["L1"] }] }] }`,
    temperature: 0.5,
  }
}

function transcript(session: SessionDoc, limit = 8) {
  const name = (id: string) => session.panel.find(p => p.id === id)?.name.split(' ')[0] ?? 'Interviewer'
  const done = session.turns.filter(t => t.attempts.length > 0).slice(-limit)
  if (done.length === 0) return '(This is the first question of the interview.)'
  return done
    .map(t => {
      const last = t.attempts[t.attempts.length - 1]
      return `${name(t.interviewerId)} asked: ${t.question}\nStudent answered: ${last.answer.slice(0, 700)}\n(${name(t.interviewerId)} was ${last.result.reaction})`
    })
    .join('\n\n')
}

const fmtConcerns = (p: Interviewer) =>
  p.concerns.map(c => `- [${c.id}] ${c.text}${c.state === 'resolved' ? ' (already settled)' : ''}`).join('\n')

// An interviewer opening their part of the conversation. If the student already said something that touches
// this interviewer's doubts, they pick it up in the student's own words, like a real panel does.
export function questionPrompt(session: SessionDoc, interviewer: Interviewer, concern: Concern) {
  const lines = session.resume.lines.filter(l => concern.lineIds.includes(l.id))
  const prev = [...session.turns].reverse().find(t => t.attempts.length > 0)
  const prevSpeaker = prev && prev.interviewerId !== interviewer.id ? session.panel.find(p => p.id === prev.interviewerId) : null
  const spoken = session.turns.some(t => t.attempts.length > 0)
  return {
    system: `${PRINCIPLES}\n\nYou are ${interviewer.name}, ${interviewer.title}, on a three-person interview panel. It is your turn to ask.\n${interviewer.persona}`,
    prompt: `${fmtTarget(session)}

Your doubts about this student (ids in brackets):
${fmtConcerns(interviewer)}
The doubt the panel expects you to start with: [${concern.id}] "${concern.text}"
Resume lines it relates to:
${lines.length ? fmtLines(lines) : '(a skill the role needs that the resume never mentions)'}

Conversation so far:
${transcript(session)}
${session.recap ? `\nThis is a rematch: the student asked to face you again after practicing. Your earlier exchange:\n${session.recap}\nDon't repeat an earlier question. Ask about what they still hadn't shown, and acknowledge it's a second round if natural.\n` : ''}
Ask the student ONE opening question.
- Max 2 short sentences, max 40 words, natural spoken English.
- Ask for how or why, not trivia or definitions. No multi-part lists, no preamble.
${spoken ? `- Listen to the conversation like a real panelist. If something the student already said connects to one of your doubts, pick it up: quote 3-12 of their exact words in "anchor" and build the question on it. Otherwise open your own topic with a short natural transition and set "anchor" to null.\n- Never repeat a question that was already asked.` : '- This is the first question of the interview. Set "anchor" to null.'}
${prevSpeaker ? `- You may open with a short bridge to the last exchange, e.g. "Building on what you told ${prevSpeaker.name.split(' ')[0]}, ...", only if it is genuinely connected.` : ''}
- "concernId": the id of the doubt your question tests (usually the one above, or one of your other open doubts if the conversation leads there).

Return JSON: { "question": "...", "anchor": "exact words" or null, "concernId": "${concern.id}", "buildsOn": ${prevSpeaker ? `"${prevSpeaker.name.split(' ')[0]}" or null` : 'null'} }`,
    temperature: 0.6,
  }
}

// The same interviewer digs into what the student just said: the heart of a natural panel conversation.
export function followUpPrompt(session: SessionDoc, interviewer: Interviewer, after: Turn, concern: Concern) {
  const last = after.attempts[after.attempts.length - 1]
  const r = last.result
  return {
    system: `${PRINCIPLES}\n\nYou are ${interviewer.name}, ${interviewer.title}, on a three-person interview panel. You just heard the student's answer and you ask a follow-up, the way a real interviewer does.\n${interviewer.persona}`,
    prompt: `${fmtTarget(session)}

Conversation so far:
${transcript(session)}

You asked: "${after.question}"
The student's answer (may be a speech transcript):
"""${last.answer}"""
How it landed with you: ${r.reaction}. Showed: ${r.criteriaMet.join('; ') || 'little'}. Missing: ${r.criteriaMissed.join('; ') || 'nothing major'}.
The doubt you are pursuing: "${concern.text}"

Ask ONE follow-up that grows directly out of what they just said.
- Pick one specific thing from their answer: a claim to check, a vague step, a trade-off they named, something they said they haven't done, or the "why" behind a choice.
- If the answer was strong, go one level deeper (an edge case, what breaks, what they would change). If it was weak, narrow it to one concrete thing they can answer from their own experience.
- "anchor": copy 3-12 words from their answer, exactly as they said them, that your question builds on.
- Speak naturally, e.g. "You said ... . How ...?" Max 2 short sentences, max 40 words. Never repeat an earlier question.

Return JSON: { "question": "...", "anchor": "exact words from their answer" }`,
    temperature: 0.6,
  }
}

export function evaluatePrompt(
  session: SessionDoc,
  interviewer: Interviewer,
  concern: Concern,
  turn: Turn,
  answer: string,
  coaching: string | null,
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
${coaching ? `The student used their one Lifeline. Sam the coach told them: ${coaching}\nJudge this answer on its merits: it must still be correct, specific and in their own words. Reading the talking points back with nothing of their own is "neutral" at best.` : ''}
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
${coaching ? '- After a Lifeline, if this attempt now addresses the core of your doubt in their own words, choose "impressed" or "neutral"; reserve "probing" for attempts that still miss the main point.' : ''}
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

Return JSON:
{ "band": "probing", "strength": 2, "criteriaMet": [], "criteriaMissed": [], "lineIds": [], "lineStatus": "yellow", "evidenceQuote": "...", "feedback": "...", "lookingFor": "...", "resolvesActiveConcern": false, "crossResolved": [{ "concernId": "..." }], "newConcern": null }`,
    temperature: 0.2,
  }
}

// Sam sees everything the panel sees: the resume, the whole conversation, what this interviewer wants, and the
// student's actual answer. Sam says what was missing and how to answer, using only the student's own material.
export function coachPrompt(session: SessionDoc, interviewer: Interviewer, concern: Concern, turn: Turn) {
  const last = turn.attempts[turn.attempts.length - 1]
  return {
    system: `${PRINCIPLES}\n\nYou are Sam, the student's coach. You sit beside the student, fully on their side. You help them answer well in their own words: you show what is missing and give talking points, never a script to read out.`,
    prompt: `${fmtTarget(session)}

The student's resume:
${fmtLines(session.resume.lines)}

Conversation so far:
${transcript(session)}

${interviewer.name.split(' ')[0]} (${interviewer.title}) is asking: "${turn.question}"
Their doubt: "${concern.text}"
What a strong candidate shows them: ${interviewer.lookingFor}
${last ? `The student's answer to this question: """${last.answer}"""\nWhat ${interviewer.name.split(' ')[0]} found missing: ${last.result.criteriaMissed.join('; ') || 'depth and specifics'}` : 'The student asked for help before answering.'}

Help the student give a strong answer.
- "missing": 1-2 short items (max 12 words each): ${last ? 'what their answer lacked, specific to what they said' : 'what this interviewer most needs to hear'}.
- "outline": 2-3 talking points, in first person, in the order to say them, max 18 words each. Build them only from facts in the resume and things the student already said in this conversation. If the resume doesn't cover something, phrase the point as how they would approach it, never as experience they didn't claim.
- "tip": one short delivery tip (max 14 words), e.g. lead with the result, or name one trade-off.
- "encouragement": a 3-8 word opener, e.g. "You know more than that answer showed."

Return JSON: { "encouragement": "...", "missing": ["..."], "outline": ["...", "..."], "tip": "..." }`,
    temperature: 0.4,
  }
}

export function huddlePrompt(session: SessionDoc, verdictLabel: string, overall: number) {
  const panel = session.panel
    .map(p => {
      const resolved = p.concerns.filter(c => c.state === 'resolved').map(c => c.text)
      const open = p.concerns.filter(c => c.state !== 'resolved').map(c => c.text)
      const asked = session.turns.filter(t => t.interviewerId === p.id && t.attempts.length).length
      if (!asked) return `[${p.id}] ${p.name} (${p.title}): did not get to ask a question; confidence ${p.confidence} is from the resume alone. Wanted to ask about: ${open.join('; ') || 'nothing'}.`
      return `[${p.id}] ${p.name} (${p.title}): asked ${asked} question${asked > 1 ? 's' : ''}; confidence ${p.startConfidence} -> ${p.confidence}. Resolved: ${resolved.join('; ') || 'none'}. Still unconvinced: ${open.join('; ') || 'nothing'}.`
    })
    .join('\n')
  const moments = session.turns
    .filter(t => t.attempts.length)
    .map(t => {
      const last = t.attempts[t.attempts.length - 1]
      const who = session.panel.find(p => p.id === t.interviewerId)?.name.split(' ')[0]
      return `${who} asked "${t.question}" -> ${last.result.reaction} (${last.result.scoreDelta >= 0 ? '+' : ''}${last.result.scoreDelta}${t.attempts.length > 1 ? ', after a Lifeline retry' : ''}${t.kind === 'follow-up' ? ', a follow-up' : ''}). Evidence: "${last.result.evidenceQuote}"`
    })
    .join('\n')
  return {
    system: `${PRINCIPLES}\n\nYou write the panel's closing deliberation and the coach's debrief. The readiness result is already decided by the scores: ${verdictLabel} (${overall}%). Never use the words "rejected" or "verdict". In the huddle, refer to the student as "they" or "the candidate".`,
    prompt: `${fmtTarget(session)}

Panel:
${panel}

Moments:
${moments || '(no answers)'}
${session.endedEarly ? `\nThe student ended the interview early, after ${session.turns.filter(t => t.attempts.length).length} answer(s). Talk only about what actually happened; anyone who did not ask can say what they wanted to ask next time.\n` : ''}
Write:
1. "huddle": 4-6 short lines of the three interviewers conferring, like judges talking among themselves. Each line max 22 words, refers to a specific moment or doubt, and they can respond to each other. Use the interviewer ids above.
2. "coachSummary": Sam's 2-3 sentence debrief to the student, in plain, honest, encouraging words.
   "coach": the same debrief in three parts, each one sentence of max 28 words, second person, about specific moments from this interview:
     { "wentWell": the student's strongest moment and why it worked, "heldBack": the main thing that cost them points (or the doubts nobody got to test if the interview ended early), "nextStep": the single most useful thing to practice next }
3. "topPractice": exactly 3 things to practice this week, imperative, max 12 words each.
4. "drills": exactly 3 sixty-second speaking drills, each { "title": max 6 words, "prompt": one sentence starting with a verb, "interviewerId": who would ask it }.
5. "perInterviewer": one entry per interviewer { "interviewerId", "takeaway": max 25 words, direct and actionable, "strongest": max 12 words, the best thing the student showed them, or "" if they did not get to ask }.

Return JSON:
{ "huddle": [{ "interviewerId": "i0", "line": "..." }], "coachSummary": "...", "coach": { "wentWell": "...", "heldBack": "...", "nextStep": "..." }, "topPractice": ["..."], "drills": [{ "title": "...", "prompt": "...", "interviewerId": "i0" }], "perInterviewer": [{ "interviewerId": "i0", "takeaway": "...", "strongest": "..." }] }`,
    temperature: 0.6,
  }
}
