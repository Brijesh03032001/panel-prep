import type { SessionDoc, Turn } from './types'

// Maya's scripted answers, keyed by the demo beat the server named for each turn, and the attempt.
const ANSWERS: Record<string, string> = {
  'm-aws:1': "Um, I just uploaded it to AWS and it worked. I think it's on S3 or something like that? I followed a tutorial for most of it.",
  'm-aws:2':
    "Okay, step by step. I run npm run build, which turns my React code into a folder of static HTML, CSS and JavaScript. I upload that folder to an S3 bucket that's set up for static website hosting. Then CloudFront sits in front of the bucket as a CDN, so it's fast and served over HTTPS on my domain. Right now I re-upload by hand, so my next step is a GitHub Action that builds and syncs on every push.",
  'm-cache:1':
    "Honestly, the first time I updated the site I kept seeing the old page and thought the deploy had failed. It turned out CloudFront was still serving the cached copy, so I created an invalidation for everything and it updated a few minutes later. Invalidating everything every time isn't ideal, so next I'd only invalidate index.html and give the other files new names on each build.",
  'm-upload:1':
    "I think I uploaded the build folder, the one npm run build makes, not my source code. Then I turned on static website hosting for the bucket. I'm not sure what else the tutorial set up after that.",
  'm-upload:2':
    "So after npm run build, I upload the build folder to an S3 bucket with static hosting turned on. To make it fast and use HTTPS on my own domain, CloudFront sits in front of the bucket and serves the files from locations near the visitor. Right now I upload by hand, so next I'd add a GitHub Action that does it on every push.",
  'l-jest:1':
    "I wrote a few Jest tests for the date formatting helper in StudyBuddy, mostly checking that times showed up in the right format. One of them caught that we were showing midnight as 24:00. I haven't really tested the React components themselves yet.",
  'l-jest:2':
    "For the booking form, I'd render it, fill in a time, click Book, and check that the new session shows up in the list. If I typed a time in the past, it should show an error instead. That would catch it if someone broke the form later.",
  'l-ui:1':
    "For the booking form, I'd render it, fill in a time, click Book, and check that the new session shows up in the list. If I typed a time in the past, it should show an error instead. That would catch it if someone broke the form later.",
  'l-edge:1':
    "Two people booking the same slot at the same moment, and time zones, because some of our group studied from home in a different time zone. I'd write one test for each and check that the list shows the right local time.",
  'p-context:1':
    "We needed the logged-in user and the selected study group on almost every screen, so passing props down five levels got messy. I put both in a Context with a provider at the top. It started to hurt when the whole app re-rendered every time the group changed, so I split it into two contexts, one for the user and one for the group, and that fixed most of it. On the team, I owned the scheduling screens and this state setup.",
  'p-team:1':
    "We split StudyBuddy by feature. I had scheduling, one teammate had chat, and the other had login and profiles. Each of us worked on our own branch and opened a pull request, and someone else had to review it before it merged. The one place we clashed was the shared Context file, so we agreed I'd be the only one changing it.",
}

export const DEMO_STUDENT = 'Maya'

export function demoAnswer(_session: SessionDoc, turn: Turn): string | null {
  if (!turn.script) return null
  return ANSWERS[`${turn.script}:${turn.attempts.length + 1}`] ?? ANSWERS[`${turn.script}:1`] ?? null
}
