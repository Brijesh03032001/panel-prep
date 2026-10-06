import type { SessionDoc, Turn } from './types'

// Maya's scripted answers, keyed by interviewer, that interviewer's question number, and attempt.
const ANSWERS: Record<string, string> = {
  'i2:1:1': "Um, I just uploaded it to AWS and it worked. I think it's on S3 or something like that? I followed a tutorial for most of it.",
  'i2:1:2':
    "Okay, step by step. I run npm run build, which turns my React code into a folder of static HTML, CSS and JavaScript. I upload that folder to an S3 bucket that's set up for static website hosting. Then CloudFront sits in front of the bucket as a CDN, so it's fast and served over HTTPS on my domain. Right now I re-upload by hand, so my next step is a GitHub Action that builds and syncs on every push.",
  'i1:1:1':
    "I wrote a few Jest tests for the date formatting helper in StudyBuddy, mostly checking that times showed up in the right format. One of them caught that we were showing midnight as 24:00. I haven't really tested the React components themselves yet.",
  'i1:1:2':
    "For the booking form, I'd render it, fill in a time, click Book, and check that the new session shows up in the list. If I typed a time in the past, it should show an error instead. That would catch it if someone broke the form later.",
  'i0:1:1':
    "We needed the logged-in user and the selected study group on almost every screen, so passing props down five levels got messy. I put both in a Context with a provider at the top. It started to hurt when the whole app re-rendered every time the group changed, so I split it into two contexts, one for the user and one for the group, and that fixed most of it. On the team, I owned the scheduling screens and this state setup.",
  'i0:1:2':
    "Before Context we passed the user and the group through every component. The pain was re-renders: changing the group refreshed everything. So I split it into two contexts, one for the user and one for the group. I owned the scheduling screens and that state setup.",
}

export const DEMO_STUDENT = 'Maya'

export function demoAnswer(session: SessionDoc, turn: Turn): string | null {
  const n = session.turns.filter(t => t.interviewerId === turn.interviewerId && t.index <= turn.index).length
  return ANSWERS[`${turn.interviewerId}:${n}:${turn.attempts.length + 1}`] ?? null
}
