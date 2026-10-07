# Panel Prep — Complete Project Document

Oct 5, 2026 · @Brijesh Kumar

## Executive summary

Panel Prep is a flight simulator for interviews. A student uploads their resume, picks the role they want, and faces a panel of three AI interviewers built specifically from that resume. The panel cross-examines them, a friendly Coach helps them learn, and the student leaves knowing exactly which lines of their resume they can and cannot defend.

**Tagline:** Know your own work before someone asks you about it.

**One-line pitch:** Every student has a line on their resume they hope nobody asks about. Panel Prep finds that line before a real interviewer does.

| Item | Detail |
| --- | --- |
| Domain | Digital learning and career readiness |
| Who it serves | Every student who will face an interview: first-gen, online, veterans, undergrads, master's, PhDs |
| What it does | Builds a three-expert interview panel from the student's own resume, interviews them, coaches them, tracks progress |
| Core philosophy | Tough panel, friendly coach |
| Hero visual | The live Defensibility Map: every resume line turns green, yellow or red as it is tested |
| Built on | The Shadow Committee engine (persona generation, confidence and concern tracking, voice, PDF reports) |
| Event | prHACKtical hackathon, digital learning track |
| Future | Same engine checks topic understanding in courses, then Project Defense for class projects |

**Why it matters.** Students rarely fail interviews because of nerves alone. They fail because they cannot explain or defend their own work under questioning. Existing tools coach how students speak; Panel Prep coaches what they know. It gives every student, including those with no one at home to practice with, a realistic panel available at any hour.

## The problem

Students have plenty of ways to practice *speaking* in an interview, but almost no way to practice *defending their own work* in front of a skeptical expert. That gap hurts most the students who have nobody around them to practice with.

### 1. The "line on your resume" problem

Every resume has a line its owner hopes nobody asks about: "Built a scalable backend," a library used once, a group project where someone else did the hard part. Real interviewers go straight for those lines. A student who cannot explain *why* they made a technical choice, or *how* their project actually works, loses the room, even if they did the work.

### 2. Practice is unequal

- A student whose parent is an engineer gets mock interviews at the dinner table. Many students have no one like that.
- More than 1 in 3 ASU undergraduates are first-generation college students ([ASU facts and figures](https://www.asu.edu/about/facts-and-figures)).
- More than 80,000 students were projected to enroll through ASU Online in fall 2025 ([ASU News](https://news.asu.edu/20250811-university-news-asu-record-enrollment-fall-2025)). They cannot walk into a career center for a practice session.
- More than 25,000 veteran and military-connected students are enrolled, a university record ([ASU facts and figures](https://www.asu.edu/about/facts-and-figures)). Many are translating real experience into a new field's language.

### 3. Existing tools coach delivery, not depth

ASU already provides Big Interview ([asu.biginterview.com](https://asu.biginterview.com/)) and Sun Devil Career Prep ([ASU Career Services](https://career.eoss.asu.edu/channels/ai/)). Big Interview's AI feedback focuses on eye contact, filler words and pace of speech ([USF Career Services](https://careers.usf.edu/resources/big-interview/)). That is useful, but nobody fails a technical interview because they said "um." They fail because they cannot defend their own work.

### 4. Generic AI chat is the wrong coach

A chatbot asked to "act as an interviewer" is one generic voice. It does not know which parts of the resume are weak, does not track what it is unconvinced about, and tends to hand over polished answers. Research shows that when AI simply gives answers, students perform worse once the AI is taken away (see Design philosophy).

### 5. The clock is short

A master's degree lasts about two years, and recruiting starts early. Most master's students begin preparing in their second semester, leaving roughly 18 months of preparation alongside full course loads. Undergraduates face the same squeeze at each internship cycle.

### The gap in one table

| What students need | Big Interview | ChatGPT-style chat | Panel Prep |
| --- | --- | --- | --- |
| Questions grounded in *my* resume | Partly (question sets by field) | If prompted | Yes, every question traces to a resume line |
| Several expert perspectives at once | No | No, one voice | Yes, three domain experts |
| Knows what it is unconvinced about | No | No | Yes, each interviewer tracks concerns and confidence |
| Coaches technical depth | No, mainly delivery | Inconsistent | Yes |
| Builds skill instead of giving answers | Partly | Often gives answers | Yes, hints and retries only |
| Tracks progress across semesters | Limited | No | Yes, readiness journey |

## Who it's for

Panel Prep is for every student who will ever sit in front of an interviewer, from a freshman applying for a campus job to a PhD moving into industry. The hackathon version focuses on technical roles; the same engine can build panels for any field.

| Student group | Their situation | What Panel Prep gives them |
| --- | --- | --- |
| First-generation students | Often no one at home has faced a professional interview | A realistic panel and a coach, available any time, for free |
| ASU Online students | Studying remotely, often while working; cannot drop into a career center | Full practice from anywhere, at any hour |
| Veterans and career-changers | Strong real-world experience, but new field's vocabulary | Panels that probe how well they translate experience into the new field |
| Freshmen and sophomores | First campus job or first internship; no interview history | A low-stakes first "real" interview and a clear list of what to improve |
| Juniors and seniors | Internship and full-time recruiting cycles | Role-specific panels and a readiness verdict before the real thing |
| Master's students | About 18 months between semester 2 and recruiting deadlines | A practice loop that runs across their whole degree |
| PhD students moving to industry | Deep expertise, but used to academic questioning | Practice explaining research to engineers, product people and hiring managers |
| Any student facing a high-stakes conversation | Grad school, scholarship or research-assistant interviews | The same panel format, tuned to the context |

### Example student: Maya (fictional)

Maya is a sophomore and the first in her family to attend college. She is applying for her first frontend internship. Her resume says she built a portfolio website with React. She did build it, but she has never had to explain it to a skeptical expert. She has no one to practice with, and her interview is in two weeks. Maya is the student the demo follows from start to finish.

## How it works, end to end

A full Panel Prep session takes about 15 to 20 minutes and moves through ten stages, from uploading a resume to a rematch the following week.

1. **Upload and pick a target.** The student uploads a resume (PDF) or project write-up and picks a target role from illustrated cards, or pastes a real job description.
2. **Resume Audit.** The app reads the resume and splits it into individual lines. It compares those lines with what the target role needs, then flags three things: strengths, gaps, and claims that sound shaky. The student watches a light sweep across the resume as weak lines briefly glow.
3. **Panel assembly.** The app picks three interviewers from a pool of domains: Frontend, Backend, DevOps/Infrastructure, UI/UX, Data/ML, System Design, QA, Mobile, Security and Behavioral. It chooses the domains that matter most for the role and where the student looks weakest. Each interviewer arrives with a name, a reason for joining ("Your resume mentions AWS but never deployment"), a starting confidence level and a list of concerns.
4. **The interview.** The panel takes turns asking questions, by voice or text. Whoever has the biggest unresolved doubt asks next. Interviewers build on each other ("Following up on what Priya asked..."). After every answer, each interviewer's confidence ring moves, their face changes, and the resume line being discussed lights up green, yellow or red.
5. **Peek behind the panel.** After an answer, the student can open an interviewer's card to see what that interviewer was looking for and what still worries them. This is where much of the learning happens.
6. **Lifeline.** Once per interview, the student can ask the Coach for help. The Coach gives a hint, never the answer, and the student tries again.
7. **Panel huddle.** When the interview ends, the three interviewer cards slide together and their short deliberation appears live, like judges conferring.
8. **Verdict and Defensibility Map.** The student receives one of three coaching verdicts: Interview Ready, Almost There or Keep Practicing. Their full resume appears with every line colored by how well they defended it.
9. **Take-aways.** The student gets a Highlight Reel of the three moments that changed the panel's mind, a Coaching Report PDF with per-interviewer feedback and a question-by-question breakdown, and a shareable "Panel Prep Wrapped" card.
10. **Practice loop.** Every concern becomes a short drill. The student can rematch only the interviewer who doubted them. A readiness journey tracks each domain across sessions and semesters.

### Example panels by role

| Target role | Panel | Why these three |
| --- | --- | --- |
| Frontend Developer Internship | Frontend Lead, QA Engineer, DevOps Engineer | Strong React on the resume; testing and deployment never mentioned |
| Backend Developer Internship | Backend Lead, System Design, Security | APIs listed, but no evidence of scaling or securing them |
| Data Analyst Internship | SQL and Data expert, Statistics expert, Behavioral | Dashboards listed, but no statistical reasoning shown |
| ML Engineer (new grad) | Data/ML Lead, System Design, DevOps | Models trained in notebooks; no evidence of deployment |
| Mobile Developer Internship | Mobile Lead, UI/UX Designer, Backend | App built, but design decisions and data sync unexplained |
| Nursing Residency (future, non-tech) | Clinical Educator, Charge Nurse, Patient Safety Officer | Shows the engine works beyond computing |

## Signature features

Twelve features make Panel Prep feel like a real panel and a real coach. The first four carry the demo; the rest make it a habit students return to.

| # | Feature | What it does | Why it matters | Wow moment |
| --- | --- | --- | --- | --- |
| 1 | Live Defensibility Map | Shows the resume beside the interview; each line turns green, yellow or red as it is tested | Makes progress visible to anyone, technical or not | Watching a resume line turn red the moment an answer falls short |
| 2 | A panel built for you | Picks three domain experts from the role and the resume's gaps | Two students applying to the same job can get different panels | Interviewer cards fly in, each saying why they joined |
| 3 | Coach and Lifeline | A friendly Coach sits beside the student; one Lifeline per interview gives a hint, never the answer | Keeps pressure real while keeping learning safe | The retry after a hint, and the confidence ring climbing |
| 4 | Panel huddle | The three interviewers deliberate visibly before the verdict | Makes the verdict feel fair and human | Cards lean together and their discussion types out live |
| 5 | Real reactions | Each interviewer shows impressed, neutral, probing or skeptical, with a confidence ring | The student reads the room, like a real interview | A floating "+12" or "-8" after each answer |
| 6 | Peek behind the panel | Opens an interviewer's card to show what they were looking for and what still worries them | Turns every question into a lesson | Seeing the exact concern behind a tough question |
| 7 | Coaching verdict | Interview Ready, Almost There or Keep Practicing; never "rejected" | Motivates instead of discouraging | A gold badge dropping in, with confetti for Interview Ready |
| 8 | The Comeback | Rematch only the interviewer who doubted you | Practice targets the real weak spot | A card flipping from skeptical to impressed |
| 9 | Highlight Reel | Replays the three answers that moved the panel most, with audio | Shows students what a strong answer sounds like in their own voice | "This answer earned +18 from Marcus" |
| 10 | Panel Prep Wrapped | A shareable recap card, styled like Spotify Wrapped | Students share it, which spreads the tool | "You defended 9 of 12 resume lines" |
| 11 | Readiness journey | Tracks confidence per domain across sessions and semesters | Turns a one-off mock interview into a degree-long habit | A timeline climbing from semester 2 to graduation |
| 12 | Coaching Report PDF | Per-interviewer feedback, question-by-question breakdown, evidence quotes and drills | Something to review later or share with a career advisor | A polished, branded report ready to download |

### Supporting details

- **Voice or text.** Students can speak or type. Each interviewer has a distinct voice, and the Coach has a warm one. Live captions run throughout.
- **Job description mode.** Pasting a real job posting tunes the panel to that specific employer's needs.
- **Evidence on every concern.** Every score change quotes the student's own words that caused it, so feedback is specific and can be challenged.
- **Drills from concerns.** Each unresolved concern becomes a 60-second drill, such as "Explain how your app handles login in one minute."

## Design philosophy: tough panel, friendly coach

Panel Prep keeps interview pressure real but never punishing. The panel pushes hard, like real interviewers; the Coach is fully on the student's side. This split is what turns a stress simulator into a learning tool.

### Five principles

1. **Pressure, not punishment.** Interviewers can be skeptical, but never hostile or frustrated. Interview anxiety is already real for many students; the app should build confidence, not damage it.
2. **Hints, not answers.** The Coach never shows a perfect answer to copy. In a field experiment with nearly 1,000 high-school math students, those who practiced with an unrestricted GPT-4 tutor did worse on exams once the AI was removed, while a version that gave hints instead of answers largely avoided that harm (Bastani et al., "Generative AI Can Harm Learning," PNAS, 2025). Panel Prep follows the hint-based design.
3. **Evidence on every judgment.** Every score change quotes the student's exact words. Students can see why a concern was raised and push back if the panel got it wrong.
4. **Coaching language.** Verdicts are Interview Ready, Almost There and Keep Practicing. The word "rejected" never appears.
5. **Learning by doing.** Students learn most when they must explain and defend ideas themselves. The panel creates that need; the Coach and drills turn it into progress.

### Reaction vocabulary

| Reaction | When it appears | Color | What the student should feel |
| --- | --- | --- | --- |
| Impressed | A clear, specific, correct answer | Green | "That landed." |
| Neutral | An acceptable answer that did not change their view | Gray | "Keep going." |
| Probing | A partial answer; they want more detail | Amber | "Go deeper." |
| Skeptical | Vague, incorrect or unsupported answer | Soft coral (never harsh red) | "I need to back this up." |

### Accessibility and inclusion

- Voice or text input, with live captions on every spoken question.
- No time-pressure penalties in the default mode; a "realistic mode" toggle adds timing for students who want it.
- Colors are never the only signal: every reaction also has an icon and a label.
- Plain-language feedback, with technical terms explained inline.

## Visual design system

The look is a spotlight stage: the student is on stage in front of their panel. It should feel premium and slightly cinematic, but warm and friendly rather than corporate.

### Color palette

| Role | Color | Hex | Used for |
| --- | --- | --- | --- |
| Stage background | Deep navy | #0F1226 | Main background, with a soft spotlight gradient behind the panel |
| Surface | Raised navy | #1A1F3D | Cards, panels, resume map |
| Interviewer 1 | Violet | #8B5CF6 | Card border, ring and name tag for the first interviewer |
| Interviewer 2 | Teal | #14B8A6 | Second interviewer |
| Interviewer 3 | Coral orange | #FB923C | Third interviewer |
| Coach and verdict | ASU gold | #FFC627 | Coach character, Lifeline button, verdict badge |
| Accent | ASU maroon | #8C1D40 | Small brand touches, report header |
| Impressed | Green | #22C55E | Positive reactions, green resume lines |
| Probing | Amber | #F59E0B | Partial answers, yellow resume lines |
| Skeptical | Soft coral | #F87171 | Doubts and red resume lines (never a harsh red) |
| Text | Off-white | #F5F5F7 | Body text on dark backgrounds |

Giving each interviewer a signature color lets anyone in the room follow who is speaking without reading a label.

### Typography

- **Headings:** Space Grotesk (Google Fonts) for character.
- **Interface and body:** Inter (Google Fonts) for clarity.
- **Numbers:** Inter with tabular figures, so animated scores do not jitter.

### Characters and avatars

- A consistent stylized style (illustrated or soft 3D), not photorealistic faces, which can look slightly unsettling.
- Each interviewer has a name, a domain, a signature color and four expressions: impressed, neutral, probing, skeptical.
- The Coach is a fourth character in ASU gold, always friendly, shown in the bottom corner.
- Example cast: Priya (Frontend Lead, violet), Lena (QA Engineer, teal), Marcus (DevOps Engineer, coral), Sam (Coach, gold).

### Motion rules

- Every number animates; nothing just appears.
- Cards enter with a spring motion instead of blinking on.
- Only one big animation at a time, so the eye always knows where to look.
- Score changes show a floating "+12" or "-8" that drifts up and fades.
- Expression changes cross-fade over about 300 milliseconds.

### Sound (subtle)

- A soft chime when an interviewer becomes impressed; no negative sounds.
- Distinct text-to-speech voices per interviewer and a warm voice for the Coach.
- A short celebratory sound with the confetti for Interview Ready.

### Presentation-screen check

Projectors often wash out dark themes. Test on the actual venue screen and raise contrast if needed.

## Screen-by-screen walkthrough

The app has seven screens. Each has one job and one wow moment.

### Screen 1: Upload and target role

- **Purpose:** Get the resume and the goal in under 30 seconds.
- **Layout:** A large drag-and-drop zone on the left; a grid of illustrated role cards on the right (Frontend, Backend, Data, ML, Mobile, Design, and more), plus a "paste a job description" option. A single gold "Build my panel" button.
- **Wow moment:** After upload, a light sweep scans the resume and the weak lines briefly glow.

### Screen 2: Panel assembly

- **Purpose:** Introduce the three interviewers and explain why each was chosen.
- **Layout:** A dark stage with a spotlight. Three cards fly in one at a time, each with avatar, name, domain, signature color and one sentence on why they joined.
- **Wow moment:** "Marcus, DevOps Engineer. Joining because your resume mentions AWS but never explains deployment."

### Screen 3: Interview room (hero screen)

- **Purpose:** The live interview.
- **Layout:**
  - Top: three interviewer cards in a row, each with an avatar, a confidence ring and a reaction label. The active speaker glows in their color.
  - Center: a speech bubble with the current question and live captions.
  - Right: the live Defensibility Map, the resume as a list of lines, each turning green, yellow or red as it is tested.
  - Bottom: the student's input bar with a voice waveform, a text option and a gold Lifeline button.
  - Bottom corner: Sam the Coach.
- **Wow moment:** After an answer, a ring animates with a floating "+12" or "-8," the face changes, and a resume line changes color at the same moment.

### Screen 4: Panel huddle

- **Purpose:** Make the verdict feel fair and human.
- **Layout:** The three cards slide toward the center and lean together. Their short discussion types out beneath them.
- **Wow moment:** "Marcus: still not convinced on deployment. Priya: but the component design was strong."

### Screen 5: Verdict and Defensibility Map

- **Purpose:** Deliver the result as coaching.
- **Layout:** A large gold badge drops in with the verdict. Below it, the full resume with every line colored, a score per interviewer and the top three things to practice.
- **Wow moment:** Confetti for Interview Ready; for other verdicts, a calm "Here's your path to ready" panel instead.

### Screen 6: Highlight Reel and Report

- **Purpose:** Turn the session into lessons.
- **Layout:** Three moment cards (the biggest score changes) with audio playback, plus a "Download Coaching Report" button.
- **Wow moment:** Hearing the exact answer that earned "+18 from Marcus."

### Screen 7: Wrapped and Readiness journey

- **Purpose:** Make students want to share and return.
- **Layout:** A vertical, phone-shaped recap card styled like Spotify Wrapped, with a share button. Below it, a timeline of sessions showing confidence per domain over time, plus Rematch and Drill buttons.
- **Wow moment:** "You defended 9 of 12 resume lines. Toughest critic: Marcus. Biggest comeback: +31."

## Built on the Shadow Committee engine

Panel Prep adapts a working engine from an earlier project, The Shadow Committee: an AI boardroom simulator in which a user uploads a pitch deck and a context-aware panel of three personas cross-examines them. The core mechanics carry over; the purpose, tone and learning features are new.

| Shadow Committee | Panel Prep |
| --- | --- |
| Adversarial Ingestion: reads a pitch deck and finds its weakest points | Resume Audit: reads a resume, splits it into lines and finds the ones the student cannot yet defend |
| Committee generated from the business domain (e.g. Compliance Officer, CFO) | Panel generated from the target role and resume gaps (e.g. Frontend Lead, QA, DevOps) |
| Limbic Stress Simulation: faces shift to hostile or frustrated | Real reactions, never hostile: impressed, neutral, probing, skeptical |
| Logic Integrity score | Defensibility score, per resume line and overall |
| Weighted turn selection (lower confidence, more concerns, more questions left; no back-to-back turns) | Same algorithm: whoever has the biggest unresolved doubt asks next |
| Persona evaluation card (thinking, mood, concerns) | Peek behind the panel: a learning view of what the interviewer was looking for |
| Verdict: Approved (70%+), Conditional (40-69%), Declined (under 40%) | Interview Ready (70%+), Almost There (40-69%), Keep Practicing (under 40%) |
| Executive summary | Coach's summary in plain, encouraging language |
| Downloadable dossier PDF | Coaching Report PDF with drills and evidence quotes |
| Text and voice-to-text input | Same, plus distinct voices per interviewer and live captions |
| Photorealistic boardroom | Stylized spotlight stage with friendly illustrated characters |
| Goal: "Decision Resilience" | Goal: "Know your own work" |

### What is new in Panel Prep

- The Coach character and the Lifeline hint system.
- The live Defensibility Map tied to individual resume lines.
- The panel huddle before the verdict.
- The Comeback rematch, Highlight Reel and Wrapped recap.
- Drills generated from concerns and the multi-semester readiness journey.
- A domain pool and role-to-panel selection logic for interviews.

## Architecture and tech stack

A Next.js frontend talks to the existing Shadow Committee engine, which calls a hosted AI model. All AI runs on hosted APIs, so the app runs on an ordinary laptop with no GPU. The engine stays in whatever language it already uses; only its prompts and outputs change.

### How a single answer flows through the system

1. The student speaks; the browser converts speech to text (or the student types).
2. The frontend sends the answer to the engine.
3. The engine evaluates it against the active interviewer's concerns and the conversation so far, and returns a structured result (see Data model).
4. The frontend updates instantly: the confidence ring animates, the face changes, the resume line changes color.
5. The engine's turn selector picks the next interviewer; their question was already being generated while the student answered.
6. The next question streams to the screen word by word and plays in that interviewer's voice.

### Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend framework | Next.js (App Router) with TypeScript | Fast to build; server routes can call the engine; easy deployment |
| Styling | Tailwind CSS and shadcn/ui | Polished base components, so effort goes into the hero screens |
| Animation | Framer Motion | Spring card entrances, animated rings, floating score changes, the huddle |
| Avatars | Four WebP expressions per character, cross-faded with Framer Motion; Rive as an upgrade if a teammate knows it | Fastest path to a polished look |
| Celebration | canvas-confetti | One line of code for the Interview Ready moment |
| App state | Zustand | One store for panel state, scores, concerns and resume-line colors, so every component reacts live |
| Engine | Existing Shadow Committee backend (behind FastAPI if it is Python) | Already handles persona generation, turn selection, confidence tracking, TTS and PDF export |
| Live updates | Server-Sent Events (SSE) | Streams questions and the huddle word by word; simpler than WebSockets |
| AI model | ASU CreateAI if the team's access covers it; otherwise Claude or OpenAI through an ASU-approved account | Keeps data inside approved tools |
| Resume parsing | pdfplumber (Python) or pdfjs-dist (JavaScript), then the AI splits text into numbered lines | The Defensibility Map needs each line as its own item |
| Speech to text | Browser Web Speech API (Chrome) for the demo; Whisper or Deepgram for reliability | Free and instant for the demo |
| Text to speech | The engine's existing TTS, with a distinct voice per character | Helps listeners track who is speaking |
| PDF report | The engine's existing PDF export | Already built |
| Wrapped card | html-to-image | Exports the recap card as a shareable PNG |
| Storage | SQLite with Prisma | Saves sessions for the readiness journey; no external database holding student data |
| Hosting | Vercel, plus a local copy on a laptop as backup | Present from whichever is more stable on the day |

### Key technical decisions

- **Resume as structured data.** After upload, the resume becomes a list of lines with IDs. Every evaluation says which line IDs an answer touched, which powers the live Defensibility Map. The resume is displayed as styled HTML, never as a PDF viewer.
- **Structured AI output.** Every evaluation returns the same JSON shape, so frontend and engine teams can build in parallel.
- **Pre-fetching.** The next question and its audio are generated while the student is still answering, so there is no lag between turns.
- **Demo mode.** A flag replays cached AI responses for the scripted demo path, so the demo behaves identically every time. Live mode still works for anyone who wants to try it.

### Folder structure

```
panel-prep/
├─ app/
│  ├─ page.tsx              # Upload + role picker
│  ├─ assemble/page.tsx     # Panel fly-in
│  ├─ interview/page.tsx    # Interview room + live resume map + Coach
│  ├─ verdict/page.tsx      # Huddle -> badge -> Defensibility Map
│  ├─ reel/page.tsx         # Highlight Reel + report download
│  ├─ wrapped/page.tsx      # Shareable recap + readiness journey
│  └─ api/                  # Proxies to the engine + SSE streams
├─ components/              # InterviewerCard, ScoreRing, ResumeMap, CoachBubble, HuddleView
├─ store/interview.ts       # Zustand store
├─ lib/types.ts             # Shared types (see Data model)
├─ lib/demo-cache/          # Cached responses for demo mode
├─ public/avatars/          # priya-impressed.webp, marcus-skeptical.webp, ...
└─ engine/                  # Shadow Committee, adapted for interviews
```

## Data model and AI contracts

Five shared types connect the frontend and the engine. Agreeing on them on day one lets both halves of the team build in parallel.

```ts
// A single line from the student's resume
type ResumeLine = {
  id: string;                 // e.g. "exp2-b3"
  section: string;            // "Experience", "Projects", "Skills"
  text: string;              // "Built REST API with Node and MongoDB"
  status: "untested" | "green" | "yellow" | "red";
};

// One member of the panel
type Interviewer = {
  id: string;
  name: string;               // "Marcus"
  domain: string;             // "DevOps"
  color: string;              // "#FB923C"
  joinReason: string;         // "Your resume mentions AWS but never deployment"
  confidence: number;         // 0-100
  reaction: "impressed" | "neutral" | "probing" | "skeptical";
  concerns: string[];         // unresolved doubts
  questionsLeft: number;
};

// What the engine returns after every answer
type TurnResult = {
  interviewerId: string;
  scoreDelta: number;         // e.g. +12 or -8
  reaction: "impressed" | "neutral" | "probing" | "skeptical";
  resolvedConcerns: string[];
  newConcerns: string[];
  resumeLineIds: string[];    // which lines this answer tested
  lineStatus: "green" | "yellow" | "red";
  evidenceQuote: string;      // the student's own words behind the score
  lookingFor: string;         // shown in "Peek behind the panel"
  coachHint?: string;         // only if the student used the Lifeline
};

// The verdict
type Verdict = {
  label: "Interview Ready" | "Almost There" | "Keep Practicing";
  overallScore: number;       // average confidence across the panel
  topPractice: string[];      // three things to work on
  huddle: { interviewerId: string; line: string }[];
};

// A saved session, for the readiness journey
type Session = {
  id: string;
  date: string;
  targetRole: string;
  panel: Interviewer[];
  turns: TurnResult[];
  verdict: Verdict;
  linesDefended: number;
  linesTotal: number;
};
```

### Turn selection

The next speaker is the interviewer with the highest priority score, reused from Shadow Committee:

```latex
\text{priority} = w_1(100 - \text{confidence}) + w_2 \cdot \text{unresolvedConcerns} + w_3 \cdot \text{questionsLeft} - \text{dampening}_{\text{spoke last}}
```

The dampening term stops the same interviewer from asking twice in a row.

### Verdict thresholds

| Average panel confidence | Verdict |
| --- | --- |
| 70% or higher | Interview Ready |
| 40% to 69% | Almost There |
| Below 40% | Keep Practicing |

### AI prompts the engine needs

| Prompt | Input | Output |
| --- | --- | --- |
| Resume Audit | Resume text, target role or job description | Numbered resume lines; strengths, gaps, shaky claims |
| Panel Builder | Audit results, domain pool | Three interviewers with names, domains, join reasons, starting confidence, concerns |
| Interviewer | Interviewer profile, concerns, conversation so far | The next question |
| Evaluator | Question, answer, interviewer concerns, resume lines | A TurnResult |
| Coach | Current question, the student's attempt, the concern | One hint that does not reveal the answer |
| Huddle | All interviewers' final states | A short three-way deliberation |
| Report | Full session | Coach's summary, per-interviewer feedback, drills |

## Responsible AI, privacy and data governance

Panel Prep is a practice coach, not a hiring tool, and it handles student data as little as possible. Its design follows ASU's AI governance expectations: authorized use, minimal data, and human review of AI output.

### Data handling

- **Approved tools only.** AI calls go through ASU-approved services (ASU CreateAI or an ASU-approved vendor account).
- **Minimal data.** Only the resume text and session results are stored. No grades, student IDs or other records are collected.
- **Local storage.** Sessions are kept in the app's own SQLite database, not a third-party database.
- **Student control.** Students can delete any session, or their whole history, at any time.
- **Demo data only at the hackathon.** All demos use sample or team members' own resumes, never real student records.

### Fairness and accuracy

- **Evidence-backed scoring.** Every judgment quotes the student's words, so errors are visible and can be challenged.
- **No hiring decisions.** Verdicts are coaching signals for the student alone. They are never shared with employers or used to rank students.
- **Bias checks.** Before a wider rollout, test the panel on resumes with different names, backgrounds and writing styles, and confirm that scores depend on content only.
- **Human judgment stays in charge.** Students are encouraged to review reports with a career advisor; the app supports advisors, it does not replace them.

### Student wellbeing

- No hostile reactions, no "rejected" verdict, and no negative sounds.
- The Coach frames every result as a path forward.
- The default mode has no time pressure; realistic timing is opt-in.

## Hackathon rubric fit

Panel Prep is designed to score high on all four criteria and earn the full "It Factor" bonus. Scores below are the team's own targets, not official results.

| Criterion | Judges' question | How Panel Prep answers it | Target |
| --- | --- | --- | --- |
| PrHACKticality | Does this meaningfully improve everyday work? | Students prepare continuously across semesters, not once; serves first-gen, online and veteran students who lack practice partners | 5 / 5 |
| HACKceleration | How much does this speed up or improve the work? | Instant, expert-level feedback at any hour instead of waiting for a career-center appointment; drills target the exact weak spot | 4-5 / 5 |
| HACKtivation | Is this actually usable and implementable? | Built on a working engine; runs on hosted APIs and standard web tools; demo mode guarantees reliability | 5 / 5 |
| Collaboration & Creativity | How thoughtfully was this idea developed? | Grounded in learning research (hints, not answers); new Coach, huddle and Defensibility Map concepts; clear path to topic understanding | 4-5 / 5 |
| It Factor | Extra spark or memorable quality? | The live Defensibility Map, the panel huddle, the Comeback, and a shareable Wrapped card | +2 bonus |

### One sentence judges should remember for each criterion

- **PrHACKticality:** "Every student can practice with a real panel, any time."
- **HACKceleration:** "Feedback in seconds, focused on exactly what to fix."
- **HACKtivation:** "It already works; we showed it live."
- **Collaboration & Creativity:** "Tough panel, friendly coach, backed by research."
- **It Factor:** "I watched her resume light up."

## Pitch script for non-technical judges

The pitch runs three minutes and is built on one insight: every judge has been interviewed. They do not need to understand AI; they need to remember sitting in that chair.

### Pitch rules

- Follow one student, Maya, from start to finish, and say she is an example.
- Show, do not explain. Never describe a feature that can be shown instead.
- Use one analogy throughout: a flight simulator for interviews.
- Use zero jargon.

| Do not say | Say instead |
| --- | --- |
| AI agents or personas | A panel of interviewers |
| Persona generation from resume parsing | It reads your resume and builds a panel just for you |
| Confidence score | How convinced they are |
| Turn-selection algorithm | Whoever has the biggest doubt asks next |
| Text-to-speech, speech-to-text | You just talk to them |
| LLM evaluation | It listens to your answer |

### The script

**\[0:00 – Hook: involve the room\]** "Quick show of hands: who has ever walked out of an interview and thought, 'I should have said...'?" *(Pause while hands go up.)* "Everyone. That feeling is what we're here to fix."

**\[0:20 – The problem, as a story\]** "Meet Maya. She's a sophomore, the first in her family at college, applying for her first internship. Her resume says she built a website. She did build it. But she has never had to explain it to someone who's skeptical. If your mom is an engineer, you practice over dinner. Maya doesn't have that. And she's not alone: more than one in three ASU undergrads are first-generation students."

**\[0:50 – The solution, in one sentence\]** "So we built Panel Prep. Think of it as a flight simulator for interviews. Maya uploads her resume, picks the job she wants, and the app builds a panel of interviewers just for her."

**\[1:05 – Demo: the panel arrives\]** *(Cards fly in.)* "Meet her panel: Priya on design, Lena on testing, and Marcus on deployment. Marcus is here because her resume never explains how her website goes live. He's already curious about that."

**\[1:20 – Demo: the stumble\]** *(Marcus asks. Maya answers vaguely. His ring drops, his face turns skeptical, and a resume line turns red.)* "Watch Marcus. He's not convinced. And see her resume on the side? That line just turned red. That's the line a real interviewer would have caught."

**\[1:45 – Demo: the Coach\]** *(Maya taps Lifeline. The Coach gives a hint.)* "But Maya isn't alone. She has a coach. One hint, not the answer, because she has to figure it out herself." *(She answers again. Marcus's ring climbs: +15, impressed.)* "That's learning."

**\[2:10 – Demo: huddle and verdict\]** *(The cards huddle, then the gold badge drops.)* "The panel talks it over... and Maya is Almost There. Not rejected. Almost there. And she knows exactly which two lines to practice this week."

**\[2:30 – Close\]** *(Show the Wrapped card.)* "She defended 9 of her 12 resume lines. Next week, she comes back for a rematch against Marcus. Panel Prep works for any student, any major, at any stage, at two in the morning. So the first time Maya faces a real panel, it won't feel like the first time."

### Delivery tips

- One person speaks; one person drives the demo. Rehearse the hand-offs.
- Pause after each visual change, so judges can see it before you explain it.
- End on the Wrapped card and leave it on screen during questions.

## Judge Q&A

These are the questions judges are most likely to ask, with short answers in plain language.

| Likely question | Answer |
| --- | --- |
| How is this different from Big Interview or ChatGPT? | Big Interview coaches how you speak; ChatGPT is one generic interviewer. Panel Prep gives you three experts chosen from your resume's gaps, scores you on your own words, and tracks your progress across your degree. |
| What if the AI scores someone unfairly? | Every judgment shows the exact words that caused it, so students can see the reasoning and push back. It is a coach, not a gatekeeper. |
| Won't tough questions discourage students? | That is why there is a friendly Coach, no "rejected" verdict, and no frustrated faces. The panel is tough; the experience is supportive. |
| Isn't the AI just giving students answers to memorize? | No. The Coach only gives hints, and research shows that hint-based AI tutoring avoids the learning loss caused by answer-giving AI. |
| Is student data safe? | It runs inside ASU-approved AI tools, stores only the resume text and session results, and students can delete everything at any time. The demo uses sample resumes. |
| Does this only work for computer science? | No. The panel is generated from the role, so the same engine can build a nursing, finance or design panel. Today's demo focuses on technical roles. |
| How much would it cost to run? | It uses hosted AI services on a per-use basis, with no special hardware. Exact costs depend on the AI provider and usage; the team would measure them in a pilot. |
| What happens after the hackathon? | A pilot with a small group of students, then a topic-understanding mode for courses, then Project Defense for class projects. |
| Did you build all of this here? | The interview engine comes from an earlier project of ours. At the hackathon, we built the interview panels, the Coach, the live resume map, the huddle, the verdict and the practice loop. |

## Demo plan and safety

The demo follows one scripted path that behaves identically every time, with a recorded video as backup. A broken live demo costs more than any feature earns.

### The scripted demo path

1. Upload Maya's sample resume and choose Frontend Developer Internship.
2. Panel assembles: Priya (Frontend), Lena (QA), Marcus (DevOps).
3. Priya asks about React state; Maya answers well; Priya turns impressed and a resume line turns green.
4. Marcus asks how the website is deployed; Maya answers vaguely; Marcus turns skeptical and a line turns red.
5. Maya taps Lifeline; the Coach gives a hint; Maya answers again; Marcus climbs +15 to impressed.
6. Lena asks one testing question; Maya gives a partial answer; the line turns yellow.
7. Panel huddle plays.
8. Verdict: Almost There, with the Defensibility Map shown.
9. Wrapped card: "You defended 9 of 12 resume lines."

### Readiness checklist

- [ ] Demo mode replays cached responses for every step above
- [ ] Live mode tested separately, for judges who want to try it
- [ ] Backup screen recording of the full demo saved locally
- [ ] App runs from both Vercel and a local laptop copy
- [ ] Tested in Chrome on the presentation laptop, with microphone permissions granted
- [ ] Tested on the venue screen or projector for contrast
- [ ] External speaker or venue audio checked for interviewer voices
- [ ] Non-technical panel example (Nursing Residency) prepared as a slide, not live
- [ ] Full pitch rehearsed at least three times with timing

## Team plan and build order

Four roles cover the build; with three people, merge roles 3 and 4.

| Role | Owns |
| --- | --- |
| 1. Engine | New prompts for each interviewer domain, role-to-panel selection, the Coach and its hints, the huddle, the TurnResult output |
| 2. Interview room UI | Interviewer cards, confidence rings, reaction changes, speech bubbles, the huddle animation |
| 3. Resume and voice | PDF parsing into resume lines, the live Defensibility Map, speech-to-text and voice wiring |
| 4. Wrap-up and demo | Verdict screen, Highlight Reel, Wrapped card, PDF report, demo mode, backup video, rehearsal |

### Build order

1. **Foundation.** Agree on the shared types. Get one interviewer asking and scoring questions end to end, even if it looks plain.
2. **Hero screen.** Build the interview room with all three interviewers and the live Defensibility Map.
3. **Emotional beats.** Add the Coach and Lifeline, the huddle and the verdict.
4. **Take-aways.** Add the Highlight Reel, Wrapped card, PDF report and demo mode.
5. **Polish and rehearsal.** Spend all remaining time on animations, transitions and pitch practice.

### If time runs short, cut in this order

1. Readiness journey timeline (show it as a static mock-up instead)
2. Highlight Reel audio playback
3. Job description mode
4. Panel Prep Wrapped (keep only if time allows; it is the closer)

Never cut: the live Defensibility Map, the Coach and Lifeline, the huddle, and the verdict.

## Roadmap

Interview preparation comes first; the same panel then grows into a tool for checking real understanding of any topic.

1. **Hackathon (now).** Technical interview panels, Coach, live Defensibility Map, huddle, verdict, Wrapped, demo mode.
2. **Student pilot.** A small group of student volunteers uses Panel Prep before real internship interviews. Measure: sessions per student, improvement in confidence across sessions, and whether students felt more prepared afterward.
3. **More fields.** Panels for non-technical roles such as nursing, business, design and research positions.
4. **Topic understanding.** Instead of a resume, a student loads a course topic. The panel checks whether they truly understand it, not just whether they can repeat it.
5. **Project Defense in courses.** Instructors let students defend class projects in front of a panel, making student reasoning visible and supporting assessment in the age of AI.
6. **Advisor view.** With student permission, career advisors see a student's report and readiness journey, so their limited time goes to the right conversations.

## Evidence and sources

- [ASU facts and figures](https://www.asu.edu/about/facts-and-figures): more than 1 in 3 undergraduates are first-generation; more than 25,000 veteran and military-connected students in fall 2025.
- [ASU News, fall 2025 enrollment](https://news.asu.edu/20250811-university-news-asu-record-enrollment-fall-2025): more than 80,000 students projected to enroll through ASU Online.
- [ASU Big Interview portal](https://asu.biginterview.com/): ASU's existing mock interview platform.
- [ASU Career Services, AI and career planning](https://career.eoss.asu.edu/channels/ai/): Sun Devil Career Prep, an AI tool covering resume review and mock interviews.
- [USF Career Services, Big Interview](https://careers.usf.edu/resources/big-interview/): describes Big Interview's AI feedback on eye contact, filler words and pace of speech.
- Bastani, H. et al., "Generative AI Can Harm Learning," PNAS, 2025: a field experiment with nearly 1,000 students comparing an unrestricted GPT-4 tutor with a hint-based version (citation from the team's research; confirm the link before publishing).
