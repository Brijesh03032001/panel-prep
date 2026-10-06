// Scripted demo: Maya (fictional), a first-gen sophomore applying for a frontend internship.
// These are raw model outputs in the exact shape the live prompts return, so demo mode runs the real engine on them.
// To replace them with a real recording, run a live session with RECORD_FIXTURES=1 and copy data/recordings/<id>.json here.

import type { SessionDoc } from '../../types'

export const DEMO_RESUME_TEXT = `MAYA REYES (sample resume, fictional student)
Education
B.S. Computer Science, Arizona State University (expected May 2028)
Coursework: Data Structures, Web Development, Human-Computer Interaction
Projects
Built a personal portfolio website with React and Tailwind CSS
Deployed the portfolio on AWS
Added a dark-mode toggle and a responsive layout for mobile and desktop
Built StudyBuddy, a group-study scheduling app, with React and Firebase (team of 3)
Managed app state with React hooks and the Context API
Experience
Student Web Assistant, ASU Library: updated pages in the campus content management system
Fixed accessibility issues flagged by a screen-reader audit
Skills
JavaScript, TypeScript, React, HTML, CSS
Git, GitHub, Firebase, AWS
Jest (familiar)`

const FIXTURES: Record<string, unknown> = {
  audit: {
    headline: 'Real React projects with clear ownership in places, but deployment and testing are listed without the story behind them.',
    lines: [
      { section: 'Education', text: 'B.S. Computer Science, Arizona State University (expected May 2028)', flag: null, note: null },
      { section: 'Education', text: 'Coursework: Data Structures, Web Development, Human-Computer Interaction', flag: null, note: null },
      { section: 'Projects', text: 'Built a personal portfolio website with React and Tailwind CSS', flag: 'strength', note: 'Clear, relevant React project' },
      { section: 'Projects', text: 'Deployed the portfolio on AWS', flag: 'gap', note: 'Never says how it gets deployed' },
      { section: 'Projects', text: 'Added a dark-mode toggle and a responsive layout for mobile and desktop', flag: null, note: null },
      { section: 'Projects', text: 'Built StudyBuddy, a group-study scheduling app, with React and Firebase (team of 3)', flag: 'shaky', note: 'Which part was theirs in a team of 3?' },
      { section: 'Projects', text: 'Managed app state with React hooks and the Context API', flag: 'strength', note: 'Specific state-management choice' },
      { section: 'Experience', text: 'Student Web Assistant, ASU Library: updated pages in the campus content management system', flag: null, note: null },
      { section: 'Experience', text: 'Fixed accessibility issues flagged by a screen-reader audit', flag: 'gap', note: 'Which fixes, and how were they verified?' },
      { section: 'Skills', text: 'JavaScript, TypeScript, React, HTML, CSS', flag: null, note: null },
      { section: 'Skills', text: 'Git, GitHub, Firebase, AWS', flag: null, note: null },
      { section: 'Skills', text: 'Jest (familiar)', flag: 'gap', note: 'Listed, but never shown in a project' },
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

  'question:i2:1': {
    question: 'Your resume says you deployed your portfolio on AWS. Walk me through what actually happens between you saving your code and the site being live.',
    buildsOn: null,
  },
  'evaluate:i2:1:1': {
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
    followUp: null,
  },
  'coach:i2:1': {
    encouragement: 'You built this. You know the path.',
    hint: "Tell it as a journey with three stops: what your code turns into before it leaves your laptop, where those files end up living, and what happens when someone types your URL. You don't need every AWS term, just the path.",
  },
  'evaluate:i2:1:2': {
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
    followUp: null,
  },

  'question:i1:1': {
    question: 'Building on what you told Marcus, you list Jest on your resume. Tell me about one test you wrote that actually caught a bug.',
    buildsOn: 'Marcus',
  },
  'evaluate:i1:1:1': {
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
    followUp: null,
  },
  'coach:i1:1': {
    encouragement: 'A real caught bug is a strong start.',
    hint: 'Picture one screen in StudyBuddy that a classmate actually uses. What would they click, and what should they see afterward? Describe the test that would prove that still works.',
  },
  'evaluate:i1:1:2': {
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
    followUp: null,
  },

  'question:i0:1': {
    question: 'In StudyBuddy you managed state with React Context. Why Context instead of passing props, and where did it start to get painful?',
    buildsOn: null,
  },
  'coach:i0:1': {
    encouragement: 'This is your project. Take your time.',
    hint: 'Start with the problem you had before Context, then the moment it stopped working well, then what you changed. A before, a pain point, and a fix.',
  },
  'evaluate:i0:1:1': {
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
    followUp: null,
  },

  huddle: {
    huddle: [
      { interviewerId: 'i2', line: 'Their first deployment answer worried me. The second one, build then S3 then CloudFront, was real understanding.' },
      { interviewerId: 'i1', line: 'Agreed. Testing is the gap. They have tested helpers, not what users click. Very learnable, though.' },
      { interviewerId: 'i0', line: 'The state answer was the strongest of the day. They named the trade-off and the fix without prompting.' },
      { interviewerId: 'i2', line: 'I still want to hear how they would automate the deploy. That is my first question next time.' },
      { interviewerId: 'i0', line: 'Almost there, then. A couple of weeks of focused practice and I would want them on my team.' },
    ],
    coachSummary:
      'You stumbled on deployment, used your Lifeline, and came back with one of the best answers of the session. That is the real skill: you know more than your first answer shows. Next up is testing, so practice explaining a component test out loud.',
    topPractice: [
      'Write and explain one React component test',
      'Automate your portfolio deploy with a GitHub Action',
      'Lead deployment answers with build, host, deliver',
    ],
    drills: [
      { title: 'A component test in 60s', prompt: "Explain step by step how you would test StudyBuddy's booking form.", interviewerId: 'i1' },
      { title: 'Ship it on every push', prompt: 'Describe what a GitHub Action for your portfolio would do from push to live.', interviewerId: 'i2' },
      { title: 'Own your team story', prompt: 'Explain which parts of StudyBuddy you built and one decision you made.', interviewerId: 'i0' },
    ],
    perInterviewer: [
      { interviewerId: 'i0', takeaway: 'Keep leading with the why. Next, prepare a story about a trade-off you would make differently today.', strongest: 'Splitting Context to stop re-renders' },
      { interviewerId: 'i1', takeaway: 'Practice testing what users see: render, interact, check. One solid component test changes this conversation.', strongest: 'A real bug caught by a real test' },
      { interviewerId: 'i2', takeaway: 'Your second answer was strong. Make it your first, then automate the deploy so you can talk about CI.', strongest: 'Build, S3 and CloudFront, explained clearly' },
    ],
  },
}

export function demoFixture(key: string): unknown {
  return FIXTURES[key]
}

// Earlier practice sessions for the readiness journey chart, clearly marked as sample data.
export function sampleHistory(): SessionDoc[] {
  const day = 24 * 60 * 60 * 1000
  const runs = [
    { ago: 42, overall: 38, label: 'Keep Practicing' as const, conf: { frontend: 52, qa: 30, devops: 31 } },
    { ago: 21, overall: 46, label: 'Almost There' as const, conf: { frontend: 60, qa: 38, devops: 40 } },
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
    pendingFollowUp: null,
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
