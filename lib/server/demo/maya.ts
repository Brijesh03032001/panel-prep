// Scripted demo: Maya (fictional), a first-gen sophomore applying for a frontend internship.
// These are raw model outputs in the exact shape the live prompts return, so demo mode runs the real engine on them.
// To replace them with a real recording, run a live session with RECORD_FIXTURES=1 and copy data/recordings/<id>.json here.

import type { SessionDoc, VerdictLabel } from '../../types'
import { assembleDebrief, type DebriefBeat, type DebriefScript, type UnaskedBeat } from './debrief'

export const DEMO_RESUME_TEXT = `MAYA REYES (sample resume, fictional student)
Tempe, AZ

EDUCATION
Arizona State University, Tempe, AZ                                   Expected May 2028
B.S. in Computer Science
Relevant coursework: Data Structures, Web Development, Human-Computer Interaction

PROJECTS
Personal Portfolio Website | React, Tailwind CSS, AWS                              2025
- Built a personal portfolio website with React and Tailwind CSS
- Deployed the portfolio on AWS
- Added a dark-mode toggle and a responsive layout for mobile and desktop

StudyBuddy, group-study scheduling app | React, Firebase                   Spring 2025
- Built StudyBuddy with React and Firebase in a team of 3
- Managed app state with React hooks and the Context API

EXPERIENCE
Student Web Assistant, ASU Library                                 Aug 2024 - Present
- Updated pages in the campus content management system
- Fixed accessibility issues flagged by a screen-reader audit

SKILLS
Languages and frameworks: JavaScript, TypeScript, React, HTML, CSS
Tools and cloud: Git, GitHub, Firebase, AWS
Testing: Jest (familiar)`

const ASU = { title: 'Arizona State University', detail: 'Tempe, AZ', date: 'Expected May 2028' }
const PORTFOLIO = { title: 'Personal Portfolio Website', detail: 'React, Tailwind CSS, AWS', date: '2025' }
const STUDYBUDDY = { title: 'StudyBuddy', detail: 'Group-study scheduling app · React, Firebase', date: 'Spring 2025' }
const LIBRARY = { title: 'Student Web Assistant', detail: 'ASU Library, Tempe', date: 'Aug 2024 – Present' }

const FIXTURES: Record<string, unknown> = {
  audit: {
    title: 'Maya Reyes',
    headline: 'Real React projects with clear ownership in places, but deployment and testing are listed without the story behind them.',
    lines: [
      { section: 'Education', entry: ASU, text: 'B.S. in Computer Science', flag: null, note: null },
      { section: 'Education', entry: ASU, text: 'Relevant coursework: Data Structures, Web Development, Human-Computer Interaction', flag: null, note: null },
      { section: 'Projects', entry: PORTFOLIO, text: 'Built a personal portfolio website with React and Tailwind CSS', flag: 'strength', note: 'Clear, relevant React project' },
      { section: 'Projects', entry: PORTFOLIO, text: 'Deployed the portfolio on AWS', flag: 'gap', note: 'Never says how it gets deployed' },
      { section: 'Projects', entry: PORTFOLIO, text: 'Added a dark-mode toggle and a responsive layout for mobile and desktop', flag: null, note: null },
      { section: 'Projects', entry: STUDYBUDDY, text: 'Built StudyBuddy with React and Firebase in a team of 3', flag: 'shaky', note: 'Which part was theirs in a team of 3?' },
      { section: 'Projects', entry: STUDYBUDDY, text: 'Managed app state with React hooks and the Context API', flag: 'strength', note: 'Specific state-management choice' },
      { section: 'Experience', entry: LIBRARY, text: 'Updated pages in the campus content management system', flag: null, note: null },
      { section: 'Experience', entry: LIBRARY, text: 'Fixed accessibility issues flagged by a screen-reader audit', flag: 'gap', note: 'Which fixes, and how were they verified?' },
      { section: 'Skills', entry: null, text: 'Languages and frameworks: JavaScript, TypeScript, React, HTML, CSS', flag: null, note: null },
      { section: 'Skills', entry: null, text: 'Tools and cloud: Git, GitHub, Firebase, AWS', flag: null, note: null },
      { section: 'Skills', entry: null, text: 'Testing: Jest (familiar)', flag: 'gap', note: 'Listed, but never shown in a project' },
    ],
    missing: [
      { skill: 'Component testing', why: 'Frontend internships expect UI tests, not just utilities.' },
      { skill: 'CI/CD', why: 'Teams ship through automated build and deploy pipelines.' },
    ],
  },

  panel: {
    interviewers: [
      {
        domain: 'frontend',
        name: 'Priya Raman',
        title: 'Frontend Lead',
        intro: "Hi, I'm Priya Raman. I lead our frontend team, and I've spent about eight years building React apps and the design systems behind them.",
        joinReason: 'Your StudyBuddy app uses React Context, and I want to hear why you chose it.',
        lookingFor: 'Reasons behind component and state decisions, with the trade-offs named.',
        persona: 'You lead a frontend team and care about why, not just what. You probe component design, state and accessibility, and you warm up quickly to candidates who name trade-offs. Specific examples from their own code convince you; buzzwords do not.',
        startConfidence: 62,
        concerns: [
          { text: 'How state is shared across StudyBuddy screens', lineIds: ['L7', 'L6'] },
          { text: 'Their exact role in a team of three', lineIds: ['L6'] },
          { text: 'Accessibility work beyond fixing flagged issues', lineIds: ['L9'] },
        ],
      },
      {
        domain: 'qa',
        name: 'Leo Park',
        title: 'QA Engineer',
        intro: "Hey, I'm Leo Park, a QA engineer. I build the test suites that keep our releases from breaking, from small unit tests to full user flows.",
        joinReason: 'Jest is on your resume, but none of your projects mention a single test.',
        lookingFor: 'Knowing what to test, at which level, and showing a test that protects real users.',
        persona: 'You are a quality engineer who believes untested code is unfinished code. You ask for concrete tests the candidate wrote and what they caught. Honest, specific answers about limits convince you more than claims of full coverage.',
        startConfidence: 42,
        concerns: [
          { text: 'Testing listed but never demonstrated', lineIds: ['L12'] },
          { text: 'How regressions are caught before release', lineIds: ['L3'] },
          { text: 'Edge cases in the scheduling logic', lineIds: ['L6'] },
        ],
      },
      {
        domain: 'devops',
        name: 'Marcus Hale',
        title: 'DevOps Engineer',
        intro: "Good to meet you. I'm Marcus Hale, a DevOps engineer. I run our deployment pipelines and keep our sites fast and online.",
        joinReason: 'Your resume mentions AWS but never explains how the site actually goes live.',
        lookingFor: 'A clear path from code to a live site: how it is built, where it lives, how users reach it.',
        persona: 'You run deployment pipelines and get skeptical when "deployed on AWS" has no detail behind it. You ask the candidate to walk through the path step by step. Plain, ordered explanations convince you; vague cloud words do not.',
        startConfidence: 35,
        concerns: [
          { text: 'Deployment process never explained', lineIds: ['L4', 'L11'] },
          { text: 'No automated build or deploy pipeline', lineIds: [] },
          { text: 'How the site is monitored once it is live', lineIds: ['L4'] },
        ],
      },
    ],
  },

  // ── Marcus (DevOps): opener on the AWS line, then a follow-up on whatever Maya actually said.
  'question:i2:1': {
    question: 'Your resume says you deployed your portfolio on AWS. Walk me through what actually happens between you saving your code and the site being live.',
    anchor: null,
    concernId: 'i2c0',
    buildsOn: null,
    script: 'm-aws',
  },
  'evaluate:m-aws:1': {
    band: 'skeptical',
    strength: 2,
    criteriaMet: [],
    criteriaMissed: ['Build step', 'Where the files are hosted', 'How visitors reach the site'],
    lineIds: ['L4', 'L11'],
    lineStatus: 'red',
    evidenceQuote: 'I just uploaded it to AWS and it worked',
    feedback: "You clearly got it online, but I couldn't hear the steps in between. Walk me from your code to a live URL.",
    lookingFor: 'A clear path from code to a live site: how it is built, where the files live, and how visitors reach them.',
    resolvesActiveConcern: false,
    crossResolved: [],
    newConcern: null,
  },
  'coach:m-aws': {
    encouragement: 'You built this. You know the path.',
    missing: ['The steps between saving your code and the live site', 'Where the files live, and how visitors reach them'],
    outline: [
      'Start with the build: what my React code turns into before it leaves my laptop',
      'Then where that folder goes on AWS, and how it is hosted there',
      'Finish with how a visitor reaches it, and what I would automate next',
    ],
    tip: 'Tell it as a journey with three stops, in your own words.',
  },
  'evaluate:m-aws:2': {
    band: 'impressed',
    strength: 3,
    criteriaMet: ['Build step explained', 'Hosting and CDN named', 'Knows the next improvement'],
    criteriaMissed: ['Refreshing cached files'],
    lineIds: ['L4', 'L11', 'L3'],
    lineStatus: 'green',
    evidenceQuote: 'I run npm run build, which turns my React code into a folder of static HTML, CSS and JavaScript',
    feedback: 'That is the answer I was hoping for: build, host, deliver, and you named your own next step. Lead with that structure next time.',
    lookingFor: 'A clear path from code to a live site: how it is built, where the files live, and how visitors reach them.',
    resolvesActiveConcern: true,
    crossResolved: [],
    newConcern: 'How cached files are refreshed after a new deploy',
  },
  'followup:m-aws:2': {
    question: "You said CloudFront sits in front of the bucket. When you upload a new build, how do you make sure visitors don't keep seeing the old version?",
    anchor: 'CloudFront sits in front of the bucket',
    script: 'm-cache',
  },
  'evaluate:m-cache:1': {
    band: 'impressed',
    strength: 1,
    criteriaMet: ['Hit the stale-cache problem for real', 'Knows how invalidation works', 'Named a better approach'],
    criteriaMissed: ['How long files stay cached'],
    lineIds: ['L4'],
    lineStatus: 'green',
    evidenceQuote: 'CloudFront was still serving the cached copy, so I created an invalidation for everything',
    feedback: 'You learned this the real way, by running into it. Naming the cheaper fix afterwards is exactly what I listen for.',
    lookingFor: 'Knowing that a CDN caches files, and how a new deploy still reaches every visitor.',
    resolvesActiveConcern: true,
    crossResolved: [],
    newConcern: null,
  },
  'followup:m-aws:1': {
    question: "Let's slow it down. You said you followed a tutorial and it ended up on S3. What exactly did you upload there?",
    anchor: 'I followed a tutorial for most of it',
    script: 'm-upload',
  },
  'evaluate:m-upload:1': {
    band: 'probing',
    strength: 2,
    criteriaMet: ['Knows the build output is uploaded'],
    criteriaMissed: ['How visitors reach the site', 'HTTPS or a CDN'],
    lineIds: ['L4', 'L11'],
    lineStatus: 'yellow',
    evidenceQuote: 'I uploaded the build folder, the one npm run build makes, not my source code',
    feedback: "Good, you know it's the build output that goes up, not your source. Now follow it the rest of the way: how does a visitor's browser reach it?",
    lookingFor: 'A clear path from code to a live site: how it is built, where the files live, and how visitors reach them.',
    resolvesActiveConcern: false,
    crossResolved: [],
    newConcern: null,
  },
  'coach:m-upload': {
    encouragement: 'You already have the first step.',
    missing: ['What happens between the bucket and a visitor', 'How the site is served fast and over HTTPS'],
    outline: [
      'I run npm run build and upload that build folder to an S3 bucket with static hosting',
      'Then I explain what sits in front of the bucket, so visitors get it fast and securely',
      'I finish with how I would make updates automatic',
    ],
    tip: 'Say it in order, like directions from your laptop to the visitor.',
  },
  'evaluate:m-upload:2': {
    band: 'impressed',
    strength: 2,
    criteriaMet: ['Full path from build to visitor', 'CDN and HTTPS named', 'Knows the next improvement'],
    criteriaMissed: ['Refreshing cached files'],
    lineIds: ['L4', 'L11', 'L3'],
    lineStatus: 'green',
    evidenceQuote: 'CloudFront sits in front of the bucket and serves the files from locations near the visitor',
    feedback: 'That is the whole path, in order, in your own words. Lead with it next time without needing the nudge.',
    lookingFor: 'A clear path from code to a live site: how it is built, where the files live, and how visitors reach them.',
    resolvesActiveConcern: true,
    crossResolved: [],
    newConcern: null,
  },

  // ── Leo (QA): opener on Jest, then a follow-up on what Maya admitted or claimed.
  'question:i1:1': {
    question: 'Building on your deploy story with Marcus: you list Jest on your resume. Tell me about one test you wrote that actually caught a bug.',
    anchor: null,
    concernId: 'i1c0',
    buildsOn: 'Marcus',
    script: 'l-jest',
  },
  'evaluate:l-jest:1': {
    band: 'probing',
    strength: 2,
    criteriaMet: ['A real bug caught', 'Honest about limits'],
    criteriaMissed: ['Component or UI tests', 'A testing strategy'],
    lineIds: ['L12', 'L6'],
    lineStatus: 'yellow',
    evidenceQuote: 'One of them caught that we were showing midnight as 24:00',
    feedback: 'A real bug caught by a real test is a great start. The gap is testing what users actually see and click.',
    lookingFor: 'Testing what users experience, not just helper functions, and knowing when each kind of test fits.',
    resolvesActiveConcern: false,
    crossResolved: [],
    newConcern: null,
  },
  'coach:l-jest': {
    encouragement: 'A real caught bug is a strong start.',
    missing: ['A test of something a user actually clicks', 'Why that kind of test matters'],
    outline: [
      'Keep the midnight bug: my Jest test on the date helper caught it',
      'Pick one StudyBuddy screen a classmate really uses, like booking a session',
      'Describe that test: what it clicks, and what it checks afterward',
    ],
    tip: 'Lead with the user, then the test.',
  },
  'evaluate:l-jest:2': {
    band: 'neutral',
    strength: 3,
    criteriaMet: ['Tests a real user flow', 'Covers an error case'],
    criteriaMissed: ['Which tool renders the component'],
    lineIds: ['L12', 'L6'],
    lineStatus: 'green',
    evidenceQuote: 'fill in a time, click Book, and check that the new session shows up in the list',
    feedback: 'That is a real user-level test. Next, name the tool you would render it with and why.',
    lookingFor: 'Testing what users experience, not just helper functions, and knowing when each kind of test fits.',
    resolvesActiveConcern: true,
    crossResolved: [],
    newConcern: null,
  },
  'followup:l-jest:1': {
    question: "You said you haven't really tested the React components themselves yet. Pick one StudyBuddy screen. How would you test it?",
    anchor: "I haven't really tested the React components themselves yet",
    script: 'l-ui',
  },
  'evaluate:l-ui:1': {
    band: 'neutral',
    strength: 3,
    criteriaMet: ['Tests a real user flow', 'Covers an error case'],
    criteriaMissed: ['Which tool renders the component'],
    lineIds: ['L12', 'L6'],
    lineStatus: 'green',
    evidenceQuote: 'fill in a time, click Book, and check that the new session shows up in the list',
    feedback: 'That is a real user-level test, designed on the spot. Next, name the tool you would render it with and why.',
    lookingFor: 'Testing what users experience, not just helper functions, and knowing when each kind of test fits.',
    resolvesActiveConcern: true,
    crossResolved: [],
    newConcern: null,
  },
  'followup:l-jest:2': {
    question: 'You said a time in the past should show an error. What other edge cases would you test in a scheduling app?',
    anchor: 'If I typed a time in the past, it should show an error instead',
    script: 'l-edge',
  },
  'evaluate:l-edge:1': {
    band: 'impressed',
    strength: 1,
    criteriaMet: ['Double bookings spotted', 'Time zones considered', 'A test for each'],
    criteriaMissed: ['How to fake two users at once'],
    lineIds: ['L6', 'L12'],
    lineStatus: 'green',
    evidenceQuote: 'Two people booking the same slot at the same moment, and time zones',
    feedback: 'You went straight to what actually breaks schedulers. Turn those into real tests and you have a great story.',
    lookingFor: 'Testing what users experience, not just helper functions, and knowing when each kind of test fits.',
    resolvesActiveConcern: true,
    crossResolved: [],
    newConcern: null,
  },

  // ── Priya (Frontend): opener on React Context, then a follow-up on the ownership Maya claimed.
  'question:i0:1': {
    question: "You've mentioned StudyBuddy a few times now. You wrote that you managed its state with React Context. Why Context instead of passing props, and where did it start to get painful?",
    anchor: null,
    concernId: 'i0c0',
    buildsOn: 'Leo',
    script: 'p-context',
  },
  'coach:p-context': {
    encouragement: 'This is your project. Take your time.',
    missing: ['Why Context, not just that you used it', 'Where it started to hurt, and what you changed'],
    outline: [
      'Start with the problem Context solved in StudyBuddy',
      'Then the moment it started to get painful, with one real example',
      'Finish with what I changed, and which part I owned',
    ],
    tip: 'A before, a pain point and a fix.',
  },
  'evaluate:p-context:1': {
    band: 'impressed',
    strength: 2,
    criteriaMet: ['Clear reason for Context', 'Spotted the re-render cost', 'Named their own ownership'],
    criteriaMissed: ['When a state library would fit'],
    lineIds: ['L7', 'L6', 'L10'],
    lineStatus: 'green',
    evidenceQuote: 'I split it into two contexts, one for the user and one for the group',
    feedback: 'You explained the why, the cost, and the fix, and you said exactly what you owned. That is how to answer a design question.',
    lookingFor: 'Reasoning about where state lives, with a concrete problem and fix from your own code.',
    resolvesActiveConcern: true,
    crossResolved: [],
    newConcern: null,
  },
  'followup:p-context:1': {
    question: "You said you owned the scheduling screens and the state setup. In a team of three, how did you split the work without stepping on each other's code?",
    anchor: 'I owned the scheduling screens and this state setup',
    script: 'p-team',
  },
  'evaluate:p-team:1': {
    band: 'impressed',
    strength: 1,
    criteriaMet: ['Clear split by feature', 'Pull requests with review', 'Owned the shared file'],
    criteriaMissed: ['How disagreements were settled'],
    lineIds: ['L6'],
    lineStatus: 'green',
    evidenceQuote: "The one place we clashed was the shared Context file, so we agreed I'd be the only one changing it",
    feedback: 'Clear about what you owned, and you handled the one real conflict. That is exactly what "team of 3" needed.',
    lookingFor: 'Clear ownership inside a team, and how the team worked together.',
    resolvesActiveConcern: true,
    crossResolved: [],
    newConcern: null,
  },
}

export function demoFixture(key: string): unknown {
  return FIXTURES[key]
}

// ─── Demo debrief ──────────────────────────────────────────────────────────────
// The presenter can end the demo after any answer, so the huddle and coaching plan are assembled from the
// beats that actually happened (see debrief.ts).

const DRILL_DEPLOY = { title: 'Ship it on every push', prompt: 'Describe what a GitHub Action for your portfolio would do from push to live.' }
const DRILL_PATH = { title: 'Code to live site', prompt: 'Walk through every step from saving your code to a visitor seeing it.' }
const DRILL_TEST = { title: 'A component test in 60s', prompt: "Explain step by step how you would test StudyBuddy's booking form." }
const DRILL_TEAM = { title: 'Own your team story', prompt: 'Explain which parts of StudyBuddy you built and one decision you made.' }

const DEBRIEF: Record<string, DebriefBeat> = {
  'm-aws:1': {
    line: "I asked how the portfolio goes live and heard 'I uploaded it and it worked.' The AWS line needs the steps behind it.",
    strongest: 'Honest that a tutorial did the heavy lifting',
    takeaway: 'Learn your own deploy path: the build, where the files live, and how visitors reach them.',
    practice: 'Explain your deploy as build, host, deliver in 60 seconds',
    drill: DRILL_PATH,
    coach: "Deployment caught you off guard, and it's far better to find that out here than in a real interview.",
    held: "The first deployment answer was vague: you said it worked, but not how your code gets from your laptop to a live site.",
  },
  'm-aws:2': {
    line: 'Their first deployment answer worried me. The second one, build then S3 then CloudFront, was real understanding.',
    strongest: 'Build, S3 and CloudFront, explained clearly',
    takeaway: 'Your second answer was strong. Make it your first, then automate the deploy so you can talk about CI.',
    practice: 'Lead deployment answers with build, host, deliver',
    drill: DRILL_DEPLOY,
    coach: 'You stumbled on deployment, used your Lifeline, and came back with one of the best answers of the session. That is the real skill: you know more than your first answer shows.',
    held: "Your first try on deployment cost you 8 points. The strong answer only came after the Lifeline.",
  },
  'm-cache:1': {
    line: "When I pushed on caching, they'd actually hit the stale-page problem and fixed it. That's experience, not a tutorial.",
    strongest: 'Fixed a real stale-cache problem',
    takeaway: 'Lead with build, host, deliver, then tell the cache lesson. Next, automate the deploy.',
    practice: 'Automate your portfolio deploy with a GitHub Action',
    drill: DRILL_DEPLOY,
    coach: 'When Marcus dug into your answer, you replied from real experience, which is exactly how a follow-up should go.',
    held: "Marcus still wanted to know how long files stay cached before they refresh.",
  },
  'm-upload:1': {
    line: 'They know the build folder is what goes up, but lost the thread after that. I want the whole path, not half.',
    strongest: 'Knew the build output is what gets uploaded',
    takeaway: 'Follow your deploy all the way to the visitor: hosting, CDN and HTTPS.',
    practice: 'Explain your deploy as build, host, deliver in 60 seconds',
    drill: DRILL_PATH,
    coach: 'On deployment you had the first step but not the rest. Practice telling the whole path out loud.',
    held: "On deployment you had the first step, then lost the thread after the upload.",
  },
  'm-upload:2': {
    line: 'With one nudge they walked the whole path: build folder, S3, CloudFront in front. That is the answer I wanted.',
    strongest: 'Walked the full deploy path once nudged',
    takeaway: 'Give the full path first time, without the nudge, then automate it.',
    practice: 'Lead deployment answers with build, host, deliver',
    drill: DRILL_DEPLOY,
    coach: 'You used your Lifeline well: with one nudge you walked the whole deploy path in your own words.',
    held: "Deployment took a nudge: the full path only came out after the Lifeline.",
  },
  'l-jest:1': {
    line: "They've tested helpers, not what users click. Catching the midnight bug was real, though.",
    strongest: 'A real bug caught by a real test',
    takeaway: 'Practice testing what users see: render, interact, check.',
    practice: 'Write and explain one React component test',
    drill: DRILL_TEST,
    coach: "Testing is your open door: you've tested helpers, so next practice explaining a test of something a user clicks.",
    held: "Testing: you've tested a helper function, but not yet anything a user actually clicks.",
  },
  'l-jest:2': {
    line: 'After a nudge they described a real user-level test of the booking form. That is the shift I was looking for.',
    strongest: 'Described a real user-flow test',
    takeaway: "Name the tool you'd render components with, and why.",
    practice: 'Write one React component test with a real testing tool',
    drill: DRILL_TEST,
    coach: 'With one nudge, you went from testing helpers to testing what users actually do.',
    held: "You described a good test of the booking form but couldn't name the tool that would render it.",
  },
  'l-ui:1': {
    line: 'When I asked them to pick a screen, they designed a proper test on the spot: render, book, check the list, plus the error case.',
    strongest: 'Designed a real user-flow test on the spot',
    takeaway: "You can describe the test. Now write it, and name the tool that renders the component.",
    practice: 'Write and explain one React component test',
    drill: DRILL_TEST,
    coach: 'When Leo pushed you to pick a screen, you designed a real test on the spot.',
    held: "You designed a good test on the spot but couldn't name the tool that would render the component.",
  },
  'l-edge:1': {
    line: 'They went straight to double bookings and time zones. They think about what breaks.',
    strongest: 'Spotted double bookings and time zones',
    takeaway: 'Turn those edge cases into real tests, then you can show them in an interview.',
    practice: 'Write tests for double bookings and time zones',
    drill: { title: 'Break the scheduler', prompt: 'List three ways StudyBuddy scheduling could break, and the test for each.' },
    coach: 'You think about what breaks, and that is what testers listen for.',
    held: "Leo still wanted to hear how you'd simulate two people booking at the same moment.",
  },
  'p-context:1': {
    line: 'The state answer was the strongest of the day. They named the trade-off and the fix without prompting.',
    strongest: 'Splitting Context to stop re-renders',
    takeaway: 'Keep leading with the why. Next, prepare a story about a trade-off you would make differently today.',
    practice: 'Prepare one trade-off you would make differently today',
    drill: DRILL_TEAM,
    coach: 'Your state answer named a real problem, its cost and your fix. That is exactly how to answer a design question.',
    held: "Priya wanted to hear when a dedicated state library would be the better choice.",
  },
  'p-team:1': {
    line: 'They were clear about who built what in a team of three, down to who owns the shared Context file.',
    strongest: 'Clear ownership in a team of three',
    takeaway: 'Bring that same clarity about ownership to every team project on your resume.',
    practice: 'Tell one team story with your role in the first sentence',
    drill: { title: 'Who built what', prompt: 'Explain how your team split StudyBuddy and how you handled one conflict.' },
    coach: 'You were specific about what you owned in a team, which interviewers rarely hear.',
    held: "Priya still wanted to hear how your team settled a disagreement.",
  },
}

// What a panelist who never got to ask would say, and the topic Sam points the student to.
const UNASKED: Record<string, UnaskedBeat> = {
  i0: {
    line: 'I never got my turn. Next time I want to hear why they chose React Context for StudyBuddy.',
    takeaway: "Be ready to explain your StudyBuddy state choices and what you owned.",
    practice: 'Explain one StudyBuddy design choice and its trade-off',
    drill: { title: 'Why Context?', prompt: 'Explain why you used React Context in StudyBuddy and where it got painful.' },
    topic: 'your StudyBuddy design choices',
  },
  i1: {
    line: "I didn't get my questions in. Jest is on the resume and I still haven't heard about a single test.",
    takeaway: "Be ready to describe one test you wrote and what it caught.",
    practice: 'Prepare one story about a test that caught a bug',
    drill: DRILL_TEST,
    topic: 'testing',
  },
  i2: {
    line: "I didn't get to ask. 'Deployed on AWS' still needs the story behind it.",
    takeaway: "Be ready to walk through your deploy, step by step.",
    practice: 'Explain your deploy as build, host, deliver in 60 seconds',
    drill: DRILL_PATH,
    topic: 'how your portfolio gets deployed',
  },
}

const CLOSING: Record<VerdictLabel, string> = {
  'Interview Ready': "I've heard enough. They can defend this resume, and I'd bring them in.",
  'Rising Star': "A rising star, then. A little focused practice on the open doubts and I'd want them on my team.",
  'Keep Practicing': "Not yet, but the foundations are real. I'd like to see them again after some practice.",
}
const CLOSING_EARLY: Record<VerdictLabel, string> = {
  'Interview Ready': 'We only heard part of the story, but what we heard was ready.',
  'Rising Star': 'We only heard part of the story, but on what we heard: a rising star.',
  'Keep Practicing': 'We only heard part of the story. On what we heard, it needs more practice.',
}

const MAYA_DEBRIEF: DebriefScript = { beats: DEBRIEF, unasked: UNASKED, closing: CLOSING, closingEarly: CLOSING_EARLY }

export function demoDebrief(session: SessionDoc, label: VerdictLabel) {
  return assembleDebrief(session, label, MAYA_DEBRIEF)
}

// Earlier practice sessions for the readiness journey chart, clearly marked as sample data.
export function sampleHistory(): SessionDoc[] {
  const day = 24 * 60 * 60 * 1000
  const runs = [
    { ago: 42, overall: 38, label: 'Keep Practicing' as const, conf: { frontend: 52, qa: 30, devops: 31 } },
    { ago: 21, overall: 46, label: 'Rising Star' as const, conf: { frontend: 60, qa: 38, devops: 40 } },
  ]
  return runs.map((r, i) => ({
    id: `sample-maya-${i + 1}`,
    kind: 'full',
    parentId: null,
    mode: 'demo',
    sample: true,
    createdAt: Date.now() - r.ago * day,
    status: 'complete',
    config: { maxTurns: 3, maxQuestionsPerInterviewer: 2 },
    setup: { roleKey: 'frontend', roleTitle: 'Frontend Developer', level: 'Internship', jobDescription: null, sourceName: 'Sample history' },
    resume: { headline: '', lines: [], missing: [] },
    panel: (['frontend', 'qa', 'devops'] as const).map((domain, seat) => ({
      id: `i${seat}`,
      seat: seat as 0 | 1 | 2,
      name: '',
      title: '',
      domain,
      color: '',
      voice: '',
      joinReason: '',
      lookingFor: '',
      persona: '',
      startConfidence: r.conf[domain],
      confidence: r.conf[domain],
      confidenceHistory: [r.conf[domain]],
      reaction: 'neutral',
      concerns: [],
      questionsAsked: 0,
    })),
    turns: [],
    current: null,
    lifeline: { used: false, turnId: null },
    outcome: {
      verdict: { label: r.label, overall: r.overall, perInterviewer: [] },
      huddle: [],
      coachSummary: '',
      topPractice: [],
      drills: [],
      perInterviewer: [],
      stats: {
        linesTotal: 0,
        linesTested: 0,
        linesDefended: 0,
        linesPartial: 0,
        linesShaky: 0,
        biggestGain: null,
        comeback: null,
        toughestCritic: null,
        strongestDomain: null,
      },
    },
  }))
}
