# Panel Prep

**A flight simulator for interviews.** Know your own work before someone asks you about it.

A student uploads a resume and picks the role they want. Panel Prep reads the resume like an interviewer would, assembles three expert interviewers chosen from the resume's gaps, and questions the student by voice or text. A coach helps without giving answers, every resume line turns green, yellow or red as it is tested, and the session ends in a coaching verdict, never a rejection.

Built for the prHACKtical hackathon, digital learning track, on top of the Shadow Committee engine.

---

## Why

Students rarely fail interviews because of nerves alone. They fail because they can't explain or defend their own work under questioning. Existing tools coach delivery (eye contact, filler words); generic chatbots are one voice that hands over polished answers. Students without someone at home to practice with, such as first-generation, online and career-changing students, feel this most.

Panel Prep coaches **what students know**, not just how they speak.

## The experience

| Step | What happens |
|---|---|
| **1. Upload and target** | Resume PDF (or pasted text), a target role, level, and optionally a real job posting. |
| **2. Resume Audit** | The resume is split into individual claims. Strengths, lines that need the "how", and shaky claims light up as a scan passes over them. Skills the role expects but the resume never mentions are listed. |
| **3. Panel arrival** | Three interviewers chosen from 11 domains (Frontend, Backend, DevOps, UI/UX, Data/ML, Data & Analytics, System Design, QA, Mobile, Security, Hiring Manager). Each says, in their own voice, why they joined: *"Your resume mentions AWS but never explains how the site actually goes live."* |
| **4. The interview** | Whoever has the biggest unresolved doubt asks next. Interviewers build on each other. After every answer the confidence ring moves, the face changes, a floating +12 or −8 appears, and the resume lines being tested change color on the live **Defensibility Map**. |
| **5. Peek behind the panel** | Click any interviewer to see what they were looking for, what your last answer showed and missed, and which doubts are still open. |
| **6. Lifeline** | One per interview. Sam the coach gives a hint, never the answer, and the student tries again. |
| **7. Panel huddle** | The panel slides together and confers out loud before the verdict. |
| **8. Verdict** | *Interview Ready* (70%+), *Almost There* (40–69%) or *Keep Practicing*. Full Defensibility Map, per-interviewer takeaways, three things to practice this week, three 60-second drills. |
| **9. Take-aways** | Highlight Reel of the three answers that moved the panel most (with your recorded voice), a Coaching Report PDF, a shareable Wrapped card, and a readiness journey across sessions. |
| **10. The Comeback** | Rematch only the interviewer who still has doubts. |

## What makes the engine trustworthy

- **The server owns the score.** The model chooses a reaction band (impressed, neutral, probing, skeptical) and a strength; the server maps that to the confidence change. Faces, rings and numbers always agree.
- **Evidence is verified.** Every judgment quotes the student's own words. The server checks the quote really appears in the answer; if the model paraphrased, it substitutes the closest real sentence and drops the "your words" badge.
- **Hints, not answers.** The coach is constrained to structure and guiding questions, following research that answer-giving AI tutors harm learning (Bastani et al., PNAS 2025).
- **Judged on substance.** Prompts instruct every interviewer to ignore grammar, accent and transcription errors.
- **Explainable turn order.** `priority = 0.5·(100 − confidence) + 8·open doubts + 10·questions left + 15 if they haven't spoken − 25 if they just spoke`. Everyone is heard before anyone asks twice.
- **Real follow-ups.** A partial answer can earn one "go deeper" question from the same interviewer.

## Architecture

```
Browser (Next.js, React 19, Framer Motion, Zustand)
  │  thin client: renders whatever the session engine says
  ▼
Next.js route handlers (the backend)
  ├─ POST /api/sessions                 resume → PII redaction → Resume Audit
  ├─ POST /api/sessions/:id/panel       Panel Builder
  ├─ POST /api/sessions/:id/turn        turn selection + question
  ├─ POST /api/sessions/:id/answer      NDJSON stream: evaluation first, next question second
  ├─ POST /api/sessions/:id/lifeline    coach hint, reopens the question
  ├─ POST /api/sessions/:id/next        move on without the Lifeline
  ├─ POST /api/sessions/:id/finish      verdict, stats, huddle and debrief
  ├─ POST /api/sessions/:id/rematch     single-interviewer comeback session
  ├─ GET/DELETE /api/sessions[/:id]     history, resume after refresh, delete
  ├─ POST /api/tts                      interviewer voices (disk-cached)
  └─ POST /api/transcribe               student speech to text
        │
        ├─ Session engine  lib/server/engine.ts, scoring.ts, prompts.ts
        ├─ Storage         SQLite via Drizzle + libSQL (data/panelprep.db)
        └─ AI              ASU CreateAI (Query, Speech, Audio endpoints)
```

- **Server-authoritative sessions.** Every decision lives in the session engine and is persisted after each step, so a refresh mid-interview resumes exactly where it was (`?s=<session id>`).
- **Streaming answers.** The answer endpoint streams the evaluation first so the panel reacts instantly, then the next question while the reaction animation plays.
- **One AI integration.** All model calls go through `lib/server/llm.ts`, which uses CreateAI when `CREATEAI_API_KEY` is set (Groq is a dev-only fallback).
- **Record and replay demo.** Demo mode replays scripted model outputs through the *real* engine, so the demo exercises the same scoring, evidence checks and turn selection as live mode. Set `RECORD_FIXTURES=1` during a live session to capture a new script.

## Running it

```bash
npm install
npm run dev            # http://localhost:3000
```

**Demo mode needs no keys.** Click *Watch Maya's session* on the home screen. Maya is a fictional first-generation sophomore applying for a frontend internship. Each question has a *Play Maya's answer* button so the presenter controls the pace.

**Live mode** needs an ASU CreateAI project service token:

```bash
cp .env.example .env.local     # then set CREATEAI_API_KEY
npm run check:createai         # verifies the token, model name and response shapes
npm run dev
```

Model routing: interview-loop calls (resume audit, questions, scoring, coach hints) use `CREATEAI_FAST_MODEL_NAME` (default: the CreateAI project's own model, about 3 s per call). Panel building and the verdict use `CREATEAI_MODEL_NAME` (default `gpt4o`); they run behind the audit screen and in the background while the last answer's feedback plays. With a token, interviewer voices use CreateAI Speech and spoken answers are transcribed by CreateAI Whisper. Without one, the app falls back to the browser's voices and speech recognition.

CreateAI notes, verified with a project service token: system prompts only apply when `request_source` is `"override_params"`; speech returns base64 MP3 in `response`; transcription needs `action: "query"` and `query: "transcribe this"` alongside the base64 `audio_file`. Every call sets `enable_history` and `enable_search` to false so a project's own chat history or knowledge base can't leak into an interview.

**Before demo day:**

```bash
npm run warm:demo      # with the app running: pre-generates every voice line of Maya's demo into data/tts-cache
```

After this, the demo plays real CreateAI voices instantly and keeps working if the venue Wi-Fi drops (cached audio is served from disk; without audio the app falls back to browser voices).

**Rate limits:** CreateAI projects have a tokens-per-minute limit. A full live session (audit, panel, about six questions with scoring, verdict and voices) is roughly tens of thousands of tokens, so back-to-back live sessions can hit the limit. The app retries once and then shows a friendly "give it a minute" message; voices fall back to the browser. For the event, consider a dedicated CreateAI project for Panel Prep or a temporary limit increase, and use demo mode for the scripted pitch.

**Deploying to Vercel:** set `DATABASE_URL` / `DATABASE_AUTH_TOKEN` to a hosted libSQL database (for example Turso). Vercel's filesystem doesn't persist the local SQLite file.

## Demo script (about 3 minutes)

1. *Watch Maya's session* → the Resume Audit flags "Deployed the portfolio on AWS" as *needs the how*.
2. Meet the panel: Priya (Frontend Lead), Leo (QA), Marcus (DevOps). Marcus joins because the resume "never explains how the site actually goes live."
3. Marcus asks first (biggest doubt). Play Maya's vague answer → skeptical, −8, the AWS line turns red.
4. Use the Lifeline → Sam gives a three-stops hint → play the second try → impressed, +16, lines turn green.
5. Leo builds on Marcus's question → partial answer, probing, Jest turns yellow.
6. Priya asks about React Context → impressed, +12.
7. Huddle → *Almost There, 53%* → Highlight Reel → Wrapped: "You defended 6 of 7 lines your panel tested."

## Responsible AI and privacy

- Emails, phone numbers, links and street addresses are removed before any AI call.
- Only resume text and session results are stored, in the app's own database. No student IDs or grades.
- Students can delete a session or their whole history from the verdict and journey screens.
- Verdicts are practice signals for the student alone, never hiring decisions and never shared with employers.
- No hostile language, no "rejected", no negative sounds. Realistic pressure, supportive outcome.
- Hackathon demos use the fictional sample resume only.

## Project structure

```
app/
  page.tsx                 screen router (home → audit → assemble → interview → huddle → verdict → reel → wrapped)
  api/                     session engine endpoints, tts, transcribe, config
components/pp/
  screens/                 one file per screen
  stage.tsx                boardroom stage geometry, seats, name plates
  bubble.tsx               question bubble with live captions and evidence
  resume-map.tsx           Defensibility Map
  answer-dock.tsx          voice/text input, Lifeline, demo playback
  peek.tsx, coach.tsx, journey.tsx, top-bar.tsx, primitives.tsx
lib/
  server/engine.ts         session lifecycle: audit, panel, turns, evaluation, lifeline, verdict, rematch
  server/scoring.ts        band → score mapping, evidence verification, turn selection, stats
  server/prompts.ts        Resume Audit, Panel Builder, Interviewer, Evaluator, Coach, Huddle prompts
  server/createai.ts       ASU CreateAI client (query, speech, audio)
  server/demo/maya.ts      demo script (raw model outputs) and sample history
  store.ts                 client state machine (Zustand)
  voice.ts, sfx.ts         character voices and synthesized sound cues
  report-pdf.ts            Coaching Report PDF
scripts/check-createai.mjs CreateAI connectivity check
```

## Roadmap

1. Student pilot before real internship interviews.
2. Panels for non-technical roles (nursing, business, research positions).
3. Topic understanding: load a course topic instead of a resume and defend what you learned.
4. Project Defense in courses, making student reasoning visible in the age of AI.
5. Advisor view, with student permission.
