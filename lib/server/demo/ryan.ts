// Staged pitch run: Ryan (fictional), an ASU Online senior going for a new-grad frontend role. His resume is uploaded
// through the normal live form; staged.ts recognizes it and replays these model outputs while the session presents
// as live. Leo grows skeptical about Ryan's test coverage, then Marcus is impressed by his CI pipeline, so both
// faces are on stage at once. In the pitch, Ryan spends his Lifeline on Leo's follow-up: the coached retry wins Leo
// back to probing, not over. Steps this script doesn't cover go to the live model.

import type { VerdictLabel } from '../../types'
import type { DebriefBeat, DebriefScript, UnaskedBeat } from './debrief'

/** The text of the resume PDF, for reference. staged.ts matches on the name and the project. */
export const RYAN_RESUME_TEXT = `RYAN BROOKS
Phoenix, AZ | ryan.brooks@example.com | (480) 555-0137 | ryanbrooks.example.com

EDUCATION
Arizona State University (ASU Online) | B.S. in Software Engineering | Expected Dec 2026
Relevant coursework: Web Application Development, Software Quality Assurance, Cloud Computing

EXPERIENCE
Web Developer (part-time) | Copper Canyon Credit Union, Phoenix, AZ | Jan 2025 - Present
- Rebuilt the loan calculator page in React and TypeScript
- Set up CI with GitHub Actions and preview deploys on every pull request
- Cut page load time by 40% by lazy-loading images and splitting bundles

PROJECTS
ShelfLife, grocery expiry tracker | Next.js, TypeScript, Supabase | 2025
- Built a Next.js app that reminds users before their food expires
- Wrote unit and integration tests with Jest and React Testing Library (90% coverage)
- Deployed on Vercel with automatic production deploys from main

SKILLS
Languages: JavaScript, TypeScript, HTML, CSS, SQL
Frameworks and tools: React, Next.js, Tailwind CSS, Git, GitHub Actions, Vercel, Supabase
Testing: Jest, React Testing Library`

const ASU = { title: 'Arizona State University', detail: 'ASU Online', date: 'Expected Dec 2026' }
const JOB = { title: 'Web Developer (part-time)', detail: 'Copper Canyon Credit Union, Phoenix', date: 'Jan 2025 – Present' }
const SHELFLIFE = { title: 'ShelfLife', detail: 'Grocery expiry tracker · Next.js, TypeScript, Supabase', date: '2025' }

const FIXTURES: Record<string, unknown> = {
  audit: {
    title: 'Ryan Brooks',
    headline: 'Real production frontend work and a strong deployment story, but the testing and speed claims are numbers without the evidence behind them.',
    lines: [
      { section: 'Education', entry: ASU, text: 'B.S. in Software Engineering', flag: null, note: null },
      { section: 'Education', entry: ASU, text: 'Relevant coursework: Web Application Development, Software Quality Assurance, Cloud Computing', flag: null, note: null },
      { section: 'Experience', entry: JOB, text: 'Rebuilt the loan calculator page in React and TypeScript', flag: 'strength', note: 'Real production React work' },
      { section: 'Experience', entry: JOB, text: 'Set up CI with GitHub Actions and preview deploys on every pull request', flag: 'strength', note: 'Specific, checkable pipeline claim' },
      { section: 'Experience', entry: JOB, text: 'Cut page load time by 40% by lazy-loading images and splitting bundles', flag: 'gap', note: 'No before-and-after numbers or how they were measured' },
      { section: 'Projects', entry: SHELFLIFE, text: 'Built a Next.js app that reminds users before their food expires', flag: null, note: null },
      { section: 'Projects', entry: SHELFLIFE, text: 'Wrote unit and integration tests with Jest and React Testing Library (90% coverage)', flag: 'shaky', note: 'Coverage is a number. What do the tests check?' },
      { section: 'Projects', entry: SHELFLIFE, text: 'Deployed on Vercel with automatic production deploys from main', flag: null, note: null },
      { section: 'Skills', entry: null, text: 'Languages: JavaScript, TypeScript, HTML, CSS, SQL', flag: null, note: null },
      { section: 'Skills', entry: null, text: 'Frameworks and tools: React, Next.js, Tailwind CSS, Git, GitHub Actions, Vercel, Supabase', flag: null, note: null },
      { section: 'Skills', entry: null, text: 'Testing: Jest, React Testing Library', flag: 'gap', note: 'Tools listed, but no test described' },
    ],
    missing: [
      { skill: 'Accessibility testing', why: 'Frontend teams expect keyboard and screen-reader checks, not just visual ones.' },
      { skill: 'Performance monitoring', why: 'Teams track real-user speed after launch, not a single before-and-after run.' },
    ],
  },

  panel: {
    interviewers: [
      {
        domain: 'frontend',
        name: 'Priya Raman',
        title: 'Frontend Lead',
        intro: "Hi, I'm Priya Raman. I lead our frontend team, and I've spent about eight years building React apps and the design systems behind them.",
        joinReason: 'You say you cut load time by 40%. I want to hear how you measured it.',
        lookingFor: 'Performance work backed by measurements: what was slow, what changed, and the before-and-after numbers.',
        persona:
          'You lead a frontend team and care about why, not just what. You probe performance claims, component design and accessibility, and you warm up quickly to candidates who show their numbers. Specific measurements convince you; round percentages do not.',
        startConfidence: 58,
        concerns: [
          { text: 'How the 40% faster load time was measured', lineIds: ['L5'] },
          { text: 'Component design in the loan calculator', lineIds: ['L3'] },
          { text: 'Accessibility beyond the basics', lineIds: [] },
        ],
      },
      {
        domain: 'qa',
        name: 'Leo Park',
        title: 'QA Engineer',
        intro: "Hey, I'm Leo Park, a QA engineer. I build the test suites that keep our releases from breaking, from small unit tests to full user flows.",
        joinReason: '90% coverage is a big number. I want to know what those tests actually check.',
        lookingFor: 'Tests that protect real user behavior, and an honest view of what coverage does and does not prove.',
        persona:
          'You are a quality engineer who believes untested code is unfinished code. Coverage numbers do not impress you; you ask what a test checks and what bug it would catch. Honest, specific answers about limits convince you more than big percentages.',
        startConfidence: 44,
        concerns: [
          { text: 'What the 90% coverage actually tests', lineIds: ['L7', 'L11'] },
          { text: 'Whether a test has ever caught a real bug', lineIds: ['L7'] },
          { text: 'How the loan calculator is tested before release', lineIds: ['L3'] },
        ],
      },
      {
        domain: 'devops',
        name: 'Marcus Hale',
        title: 'DevOps Engineer',
        intro: "Good to meet you. I'm Marcus Hale, a DevOps engineer. I run our deployment pipelines and keep our sites fast and online.",
        joinReason: 'You say you set up CI with preview deploys. I want to see how much of that pipeline is really yours.',
        lookingFor: 'Ownership of the path from pull request to production: checks, previews, deploys and a way back.',
        persona:
          'You run deployment pipelines and respect candidates who can walk the path from pull request to production step by step. Specific checks, real previews and a rollback they have actually used convince you; buzzwords do not.',
        startConfidence: 50,
        concerns: [
          { text: 'How the CI pipeline gates a pull request', lineIds: ['L4'] },
          { text: 'What happens when a production deploy goes wrong', lineIds: ['L8'] },
          { text: 'How problems are noticed after release', lineIds: [] },
        ],
      },
    ],
  },

  // ── Leo (QA): the coverage claim, then a follow-up on what Ryan admitted. He ends up skeptical.
  'question:i1:1': {
    question: 'Your resume says your ShelfLife tests have 90% coverage. Tell me about one test that caught a real bug before your users did.',
    anchor: null,
    concernId: 'i1c0',
    buildsOn: null,
    script: 'l-cov',
  },
  'evaluate:l-cov:1': {
    band: 'probing',
    strength: 1,
    criteriaMet: ['Honest about the kind of tests'],
    criteriaMissed: ['A bug a test actually caught', 'Tests of user behavior'],
    lineIds: ['L7', 'L11'],
    lineStatus: 'yellow',
    evidenceQuote: 'mostly snapshot tests',
    feedback: "Coverage tells me which lines ran, not what you checked. I still haven't heard about a bug a test caught.",
    lookingFor: 'Tests that protect real user behavior, and an honest view of what coverage does and does not prove.',
    resolvesActiveConcern: false,
    crossResolved: [],
    newConcern: 'Whether the tests check behavior or just markup',
  },
  'followup:l-cov:1': {
    question: "You said they're mostly snapshot tests. If someone breaks the Add item button so it stops saving, but the page still looks the same, which of your tests fails?",
    anchor: 'mostly snapshot tests',
    script: 'l-snap',
  },
  'evaluate:l-snap:1': {
    band: 'skeptical',
    strength: 2,
    criteriaMet: ['Honest about the gap'],
    criteriaMissed: ['A test that clicks and checks the result', 'Knowing what snapshot tests miss'],
    lineIds: ['L7'],
    lineStatus: 'red',
    evidenceQuote: 'Probably none of them',
    feedback: "That's honest, and it's the problem: 90% coverage, and nothing would catch a broken Add item button. A test that clicks it and checks the list would.",
    lookingFor: 'Tests that check what users actually do, not just what the page looks like.',
    resolvesActiveConcern: false,
    crossResolved: [],
    newConcern: null,
  },
  // The pitch uses the Lifeline here. Sam's outline must not start with First/Then/Finally: coachSpeech() adds them.
  'coach:l-snap': {
    encouragement: 'Owning that was the right start.',
    missing: ['A test that checks what the user does, not how the page looks'],
    outline: ['Say why: a snapshot only checks how the page looks', "Name the test you'd add: type an item, click Add item, check the list"],
    tip: 'Walk through the test the way it would run.',
  },
  // The coached retry names the right test but there is still no test, so Leo moves to probing, not impressed.
  'evaluate:l-snap:2': {
    band: 'probing',
    strength: 3,
    criteriaMet: ['Knows what a snapshot misses', 'Named a test of real behavior'],
    criteriaMissed: ['A test that already exists'],
    lineIds: ['L7'],
    lineStatus: 'yellow',
    evidenceQuote: 'clicks Add item, and checks the list',
    feedback: "That's the right test. Now I want to see it written.",
    lookingFor: 'Tests that check what users actually do, not just what the page looks like.',
    resolvesActiveConcern: false,
    crossResolved: [],
    newConcern: null,
  },

  // ── Marcus (DevOps): the CI pipeline, where Ryan is strong. He ends up impressed.
  'question:i2:1': {
    question:
      "Let's talk about where those tests run. Your resume says you set up CI with preview deploys. Walk me through what happens when you open a pull request.",
    anchor: null,
    concernId: 'i2c0',
    buildsOn: 'Leo',
    script: 'm-ci',
  },
  'evaluate:m-ci:1': {
    band: 'impressed',
    strength: 2,
    criteriaMet: ['Checks that block merges', 'A preview for every branch', 'A fast way back'],
    criteriaMissed: ['How a bad deploy gets noticed'],
    lineIds: ['L4', 'L8'],
    lineStatus: 'green',
    evidenceQuote: 'the merge button stays blocked',
    feedback: "That's a real pipeline: checks that block merges, a preview for every branch, and a quick way back. That's exactly what I listen for.",
    lookingFor: 'Ownership of the path from pull request to production: checks, previews, deploys and a way back.',
    resolvesActiveConcern: true,
    crossResolved: [],
    newConcern: 'How a bad deploy gets noticed in the first place',
  },
  'followup:m-ci:1': {
    question: 'You said you can roll back in a minute. How do you find out something broke in the first place?',
    anchor: 'roll back in a minute',
    script: 'm-roll',
  },
  'evaluate:m-roll:1': {
    band: 'impressed',
    strength: 1,
    criteriaMet: ['Alerts on errors', 'A real incident, handled'],
    criteriaMissed: ['What changed afterwards so it cannot happen again'],
    lineIds: ['L8'],
    lineStatus: 'green',
    evidenceQuote: 'The alert fired within two minutes',
    feedback: "You found it fast and fixed it faster. That's someone who has run production, not just deployed to it.",
    lookingFor: 'Knowing how a bad deploy gets noticed, and what you do about it.',
    resolvesActiveConcern: true,
    crossResolved: [],
    newConcern: null,
  },
}

export function ryanFixture(key: string): unknown {
  return FIXTURES[key]
}

// ─── Debrief ─────────────────────────────────────────────────────────────────

const DRILL_BEHAVIOR = { title: 'A behavior test in 60s', prompt: 'Explain step by step how you would test that Add item really saves an item.' }
const DRILL_COVERAGE = { title: 'Coverage vs confidence', prompt: 'Explain in 60 seconds why 90% coverage can still miss a broken button.' }
const DRILL_PIPELINE = { title: 'Ship it safely', prompt: 'Walk through your path from pull request to production in under a minute.' }

const BEATS: Record<string, DebriefBeat> = {
  // No huddle line: Leo's follow-up says it better, and the huddle stays short.
  'l-cov:1': {
    line: '',
    strongest: 'Honest about what the tests are',
    takeaway: 'Add tests that check what users do, not just what the page looks like.',
    practice: 'Explain what your tests check, not just the coverage number',
    drill: DRILL_COVERAGE,
    coach: 'You were honest that most of your coverage is snapshot tests. That honesty is the right place to start.',
    held: 'Your 90% coverage turned out to be mostly snapshot tests, which check how a page looks, not what it does.',
    // The weakest answer after a Lifeline on Leo's follow-up, so it carries the next step then.
    next: 'This week, write one React Testing Library test that types an item, clicks Add item, and checks it shows up in the list.',
  },
  'l-snap:1': {
    line: "I asked which test fails if Add item stops saving. The answer was 'probably none of them.' That's the gap.",
    strongest: '',
    takeaway: 'Write one test that clicks Add item and checks the list.',
    practice: 'Write one test that clicks Add item and checks the list',
    drill: DRILL_BEHAVIOR,
    coach: 'Leo found a real gap: if the Add item button broke, none of your tests would fail.',
    held: 'When Leo asked which test would catch a broken Add item button, the honest answer was none of them.',
    next: 'This week, write one React Testing Library test that types an item, clicks Add item, and checks it shows up in the list.',
  },
  // The pitch path: the Lifeline on Leo's follow-up. As the run's comeback, its coach line is "What went well".
  'l-snap:2': {
    line: 'None of their tests would catch a broken Add item button. After the Lifeline they named the right one. Now they need to write it.',
    strongest: 'Named the right behavior test after the Lifeline',
    takeaway: 'Write the Add item test, so next time you can show it instead of describing it.',
    practice: 'Write one test that clicks Add item and checks the list',
    drill: DRILL_BEHAVIOR,
    coach: 'You owned the gap, then used your Lifeline well: your retry named exactly the right test for the Add item button.',
    held: 'None of your tests would have caught a broken Add item button. The right answer only came after the Lifeline.',
    next: 'This week, write that React Testing Library test: type an item, click Add item, and check it shows up in the list.',
  },
  'm-ci:1': {
    line: 'The pipeline is the real deal: blocked merges, a preview for every branch, and a fast way back.',
    strongest: 'A real CI pipeline with blocked merges and previews',
    takeaway: 'Lead with your pipeline story. Next, be ready to say how you notice a bad deploy.',
    practice: 'Tell your pull-request-to-production story in 60 seconds',
    drill: DRILL_PIPELINE,
    coach: 'Your CI answer was the strongest of the session: checks that block merges, a preview for every branch, and a quick rollback.',
    held: "Marcus still wanted to hear how you'd find out a deploy went wrong.",
  },
  'm-roll:1': {
    line: "And when I pushed on rollbacks, they'd actually handled a bad deploy. That's experience.",
    strongest: 'Caught and rolled back a real bad deploy',
    takeaway: 'Tell the rollback story every time; it proves you run production.',
    practice: 'Tell your rollback story in under a minute',
    drill: { title: 'The bad deploy', prompt: 'Tell the story of the missing environment variable: how you noticed, what you did, and what you changed after.' },
    coach: 'When Marcus dug into rollbacks, you answered with a real incident, which is exactly how a follow-up should go.',
    held: 'Marcus still wanted to know what you changed so it cannot happen again.',
  },
}

const UNASKED: Record<string, UnaskedBeat> = {
  i0: {
    line: "I didn't get my turn. I wanted to hear how that 40% faster load time was measured.",
    takeaway: 'Be ready to show the before-and-after numbers behind your 40% speed-up.',
    practice: 'Prepare the numbers behind your 40% faster load time',
    drill: { title: 'Prove the 40%', prompt: 'Explain how you measured the load time before and after, and on what device.' },
    topic: 'how you measured the 40% faster load time',
  },
  i1: {
    line: "I didn't get my questions in. 90% coverage still needs a story.",
    takeaway: 'Be ready to describe one test that caught a real bug.',
    practice: 'Prepare one story about a test that caught a bug',
    drill: DRILL_COVERAGE,
    topic: 'your testing',
  },
  i2: {
    line: "I didn't get to ask. That CI pipeline still needs the story behind it.",
    takeaway: 'Be ready to walk through your pipeline from pull request to production.',
    practice: 'Tell your pull-request-to-production story in 60 seconds',
    drill: DRILL_PIPELINE,
    topic: 'your CI pipeline',
  },
}

const CLOSING: Record<VerdictLabel, string> = {
  'Interview Ready': "I've heard enough. Strong habits, and I'd bring them in.",
  'Rising Star': "A rising star with one real blind spot. Fix the tests and I'd want them on my team.",
  'Keep Practicing': "Not yet, but the engineering instincts are real. I'd like to see them again.",
}
const CLOSING_EARLY: Record<VerdictLabel, string> = {
  'Interview Ready': 'We only heard part of the story, but what we heard was ready.',
  'Rising Star': 'We only heard part of the story, but on what we heard: a rising star with one blind spot.',
  'Keep Practicing': 'We only heard part of the story. On what we heard, it needs more practice.',
}

export const RYAN_DEBRIEF: DebriefScript = { beats: BEATS, unasked: UNASKED, closing: CLOSING, closingEarly: CLOSING_EARLY }
