# Mockify (formerly Panel Prep) — Project Memory

Handoff notes for future Claude sessions. Last updated **2026-10-06**. Read this before changing anything.

**Contents**
1. Context
2. How Brijesh likes to work (follow this)
3. The product
4. Key decisions and why
5. Architecture
6. Engine rules (the "trustworthy AI" story)
7. ASU CreateAI: verified facts (important)
8. Demo mode (Maya)
9. Visual design system
10. Testing notes and quirks
11. Commands
12. Status, known issues, and next steps
13. Timeline of what was done (2026-10-05)

---

## 1. Context

- **Who:** Brijesh Kumar, on ASU EdPlus's digital learning team.
- **What:** **Mockify**, an entry in the **prHACKtical hackathon** (digital learning track).
- **Name:** the app was called **Panel Prep** until 2026-10-06, when Brijesh renamed it **Mockify**. Older notes below still say Panel Prep; they mean the same app. Every user-facing string now says Mockify: the UI, page title, the PDF header, footer and filename (`mockify-coaching-report-<role>.pdf`), Wrapped (`Mockify Wrapped`, `mockify-wrapped.png`), the AI prompts ("You are part of Mockify"), README, `docs/SYSTEM_DESIGN.md`, the re-rendered diagrams and `package.json` name. **Deliberately kept:** the folder `panel-prep/`, the GitHub repo `Brijesh03032001/panel-prep`, the DB file `data/panelprep.db` (renaming would orphan saved sessions), the localStorage key `panel-prep:prefs`, and the `components/pp/` folder. Brijesh's own project document in the parent folder was not touched.
- **Judging rubric:** four criteria, each out of 5, plus up to 2 bonus points:
  - **PrHACKticality:** does it meaningfully improve everyday work?
  - **HACKceleration:** how much does it speed up or improve the work?
  - **HACKtivation:** is it actually usable and implementable?
  - **Collaboration & Creativity:** how thoughtfully was the idea developed?
  - **It Factor:** up to 2 bonus points.
- **Audience:** the judges include non-technical people.
- **The problem it solves:** students have no good platform to practice interviews that gives real, domain-specific feedback and guidance.

### Folder layout (`~/Downloads/edplus-hackday/`)

| Path | What it is |
|---|---|
| `v0-founder-rpg/` | The **original "Shadow Committee"** app (AI boardroom pitch simulator). **Untouched.** It is the base Panel Prep was built from. |
| `panel-prep/` | **The hackathon build.** All work happens here. Git repo, pushed to github.com/Brijesh03032001/panel-prep. |
| `Panel Prep — Complete Project Document.md` / `.docx` | Brijesh's spec/pitch document, written with Claude chat. **Reference only, not a spec** (see section 2). It contains a pitch script, rubric mapping, judge Q&A and a demo plan. |
| `MEMORY.md` | This file. |
| `CLAUDE.md` | Imports this file so Claude Code loads it automatically. |

---

## 2. How Brijesh likes to work (follow this)

- **Align on the idea before coding.** He interrupted twice when Claude started implementing too early. Present a concise, opinionated design first, then build.
- **The project document is a reference, not a spec.** His words: "u dont have to blindly follow the docs… think very deep and make the best thing out of it."
- **Keep the existing illustrated boardroom art.** He rejected replacing the interviewer images with code-drawn SVG avatars: "they are literally looking good."
- **He wants a real backend**, not frontend-only. He chose a Next.js server plus a database.
- **He wants the UI to be best-in-class**, polished and cinematic.
- **AI provider: ASU CreateAI only** (ASU-approved, governance). Groq exists only as a dev fallback.
- **If he says to stop servers** (he once had a live interview), stop them immediately.
- **Don't touch his other projects or processes.** A cleanup command (`kill $(pgrep -f next-server)`) may have stopped his other app, `lost-in-the-switch` on port 3000. Never use broad process-kill patterns. Kill only the PIDs you started.

---

## 3. The product

**Panel Prep: "a flight simulator for interviews."** Tagline: *Know your own work before someone asks you about it.*

The student flow, screen by screen:

1. **Home:** upload a resume PDF or paste the text, pick a target role (10 role cards plus "Something else"), pick a level (Internship / New Grad / Full-time), and optionally paste a job posting. There is also a "Watch Maya's session" demo button.
2. **Resume Audit:** the resume is split into claims (IDs `L1..Ln`). Lines are flagged as **strength / needs the how (gap) / sounds shaky**, a light sweep animation passes over them, and skills the role needs but the resume never mentions are listed.
3. **Panel arrival:** 3 interviewers are chosen from **11 domains** (frontend, backend, devops, uiux, data_ml, data_analytics, system_design, qa, mobile, security, behavioral). Each introduces themselves by voice with a "joining because…" reason that points at a resume line.
4. **Interview room (the hero screen):** the boardroom art, the speaking interviewer's speech bubble with live word-by-word captions, a confidence ring and reaction chip per interviewer, floating +N / −N score changes, and the live **Defensibility Map** (resume lines turn green, yellow or red) on the right. The answer dock supports voice (with a waveform) or text. There is also **Sam the coach** (gold) and **one Lifeline** per interview (what was missing plus 2-3 talking points built only from the student's resume and earlier words, shown as a strip in the answer dock), plus "Peek behind the panel" (click any interviewer). **Each panelist asks 2 questions: an opener, then a follow-up built on the student's actual answer**; the bubble quotes the words it builds on ("You just said …"). Live captions appear in the text box while speaking (browser speech recognition; with CreateAI configured, Whisper replaces them on stop; in Chrome the live captions go through Google's speech service, Brijesh chose this knowingly). **"End interview & get my verdict"** (top bar) ends at any point after one answer; verdict, huddle, report and Wrapped then reflect only what was answered.
5. **Panel huddle:** the interviewers slide together and confer out loud before the verdict.
6. **Verdict:** **Interview Ready ≥70%, Almost There 40–69%, Keep Practicing <40%** (never "rejected"). A medallion drops in (with confetti only for Interview Ready). The screen shows per-interviewer takeaways, the full map, Sam's debrief, 3 things to practice this week, and 3 sixty-second drills.
7. **Highlight Reel:** the top 3 answers by |score change|, with the evidence highlighted inside the answer. Voice answers can be replayed (recordings stay client-side).
8. **Wrapped:** a shareable 9:16 recap card (PNG export via html-to-image) plus the **readiness journey** (an overall-confidence line chart and small multiples per domain).
9. **Coaching Report PDF** (jsPDF) and **Rematch**: face only the interviewer who still has doubts, with a recap of the earlier exchange.

---

## 4. Key decisions and why

| Decision | Why |
|---|---|
| Built in a **copy** (`panel-prep/`), original untouched | The original had no git commits, so editing in place would have destroyed it. |
| **Engine stays TypeScript in Next.js API routes** (no Python/FastAPI) | The original was already TS/Next. Brijesh chose "Next.js server + database". |
| **Server-authoritative session engine** + SQLite (Drizzle + libSQL) | Refresh-proof, enables history, rematch and the journey. Previously all logic lived in one React component. |
| **Server owns scoring** (the model picks a band, the server maps it to a number) | Faces, rings and deltas always agree; consistent scores. |
| **Evidence quotes verified** against the student's actual answer | Fairness ("is it fair?" is a likely judge question); no hallucinated feedback. |
| **Kept the boardroom art**; mapped 4 reactions onto 3 expressions | Brijesh's preference. Impressed→smile, neutral/probing→neutral, skeptical→worse (the "worse" images are strong, e.g. a facepalm, so they're used only for skeptical). |
| Persona genders must match the art | Seat 0 = woman, seat 1 = younger man, seat 2 = older man. `person2` has **no smile** image (falls back to neutral). |
| **Demo mode = record/replay through the real engine** | A deterministic demo that still exercises the real scoring, evidence and turn-selection code. |
| **Model tiering** (fast vs deep) | CreateAI gpt-4o took 6–12 s per evaluation, which felt too slow mid-interview. See section 7. |
| **Prefetch the verdict** as soon as the interview ends | Hides about 12 s of gpt-4o huddle generation behind the last feedback beat. |
| Session history in the DB, not localStorage | Brijesh wanted a real backend. |
| Seat colors violet `#A78BFA`, teal `#2DD4BF`, orange `#FB923C` | Validated with the dataviz skill's palette checker. Mutually CVD-safe (colorblind-safe), always paired with the interviewer's name and photo. Status colors (green/amber/coral) always carry an icon and a label. |
| Readiness journey uses **small multiples**, not a multi-series chart | Avoids needing many distinguishable colors (dataviz guidance). |

---

## 5. Architecture

```
Browser (Next.js 16 App Router, React 19, Tailwind 4, Framer Motion, Zustand)
  └─ lib/store.ts: client state machine
       screens: home → audit → assemble → interview → huddle → verdict → reel → wrapped
       interview stages: idle | asking | answering | evaluating | feedback | decision | hinting | finishing
Next.js route handlers (the backend)
  POST /api/sessions              create: PDF/text → PII redaction → Resume Audit (multipart; mode=demo|live)
  GET  /api/sessions              history (complete sessions)     DELETE /api/sessions  delete all
  GET/DELETE /api/sessions/:id    load (refresh resume) / delete
  POST /api/sessions/:id/panel    Panel Builder
  POST /api/sessions/:id/turn     select next interviewer + generate question (or {end})
  POST /api/sessions/:id/answer   NDJSON stream: {result} first, then {decision}|{next}|{end}|{error}
  POST /api/sessions/:id/lifeline coach hint, reopens the question for attempt 2
  POST /api/sessions/:id/next     "Move on" (skip the Lifeline) + next question
  POST /api/sessions/:id/finish   verdict + stats + huddle + debrief (idempotent)
  POST /api/sessions/:id/rematch  new single-interviewer session with recap (live only)
  POST /api/tts                   CreateAI speech; disk cache data/tts-cache + committed assets/demo-voices
  POST /api/transcribe            CreateAI Whisper (multipart "audio")
  GET  /api/config                {live, tts, stt, provider}
```

### Key files (panel-prep/)

- `lib/types.ts`: all shared types (`SessionDoc`, `Interviewer`, `Concern`, `Turn`, `Attempt`, `EvalResult`, `Outcome`, `ResumeLine`, `AnswerEvent`, …).
- `lib/catalog.ts`: domains, roles, levels, `SEATS` (color, voice, presentation), `SEAT_IMAGES`, `REACTIONS`, `LINE_STATUS`, `VERDICTS`, `COACH` (Sam, voice `shimmer`).
- `lib/server/engine.ts`: `createSession` (audit), `buildPanel`, `startTurn`, `submitAnswer`, `moveOn`, `applyLifeline`, `finish`, `createRematch`. Exports `EngineError`.
- `lib/server/scoring.ts`: band→delta, `verifyEvidence`, `linesMentioned` fallback, `selectNext`, `shouldEnd`, `verdictFor`, `computeStats`.
- `lib/server/prompts.ts`: Resume Audit, Panel Builder, Interviewer (question), Evaluator, Coach and Huddle prompts, plus shared PRINCIPLES (pressure not punishment; judge substance not grammar or accent; plain spoken English; JSON only).
- `lib/server/llm.ts`: `callJSON` (demo replay vs live), JSON repair, retry, rate-limit retry, `RECORD_FIXTURES`, model tier routing.
- `lib/server/createai.ts`: the CreateAI client (query, speech, transcribe, `RateLimitError`).
- `lib/server/db.ts`, `repo.ts`: one `sessions` table; the whole `SessionDoc` is stored as JSON plus summary columns. DB file `data/panelprep.db` (gitignored); Vercel needs `DATABASE_URL`.
- `lib/server/resume-text.ts`: pdf-parse (imported from `pdf-parse/lib/pdf-parse.js` to avoid its self-test bug) plus `redactPII` (emails, phones, links, addresses).
- `lib/server/http.ts`: error mapping (EngineError→status, NotFound 404, ProviderUnavailable 503, RateLimit 429), per-session lock `withLock`.
- `lib/server/demo/maya.ts`: demo fixtures plus `sampleHistory()`. `lib/demo.ts`: Maya's scripted answers for the client.
- `lib/server/demo/ryan.ts`, `staged.ts`, `debrief.ts`: Ryan's staged pitch run (section 8). `debrief.ts` holds `assembleDebrief()`, shared by Maya's demo and staged runs.
- `lib/voice.ts`: speaks lines; server TTS → browser `speechSynthesis` fallback → silent reading-pace timing. Progress callback drives captions; `prefetch()`.
- `lib/sfx.ts`: synthesized WebAudio cues (chime, pop, reveal, celebrate; never negative).
- `hooks/use-recorder.ts`: MediaRecorder + AnalyserNode waveform. Server transcription when configured, else browser speech recognition. Keeps the audio blob for the Highlight Reel.
- `lib/report-pdf.ts`: Coaching Report, **3 pages for a full run, 2 for an early end** (page 1: gauge + readiness scale, 4 KPIs, side-by-side **Your Strengths** (green) / **What to work on** (amber) panels, Sam's three-part note; page 2: Practice this week, 60-second drills, interviewer cards, Defensibility Map; page 3: question by question). See the seventh pass in section 13. `buildCoachingReport()` returns the jsPDF doc; `downloadCoachingReport()` saves it. WinAnsi-safe characters only (no "→", no "−"); icons are drawn with shapes.
- **Navigation (lib/store.ts):** every screen is a history entry (`?s=<session>&v=<screen>`); `show(screen, push|replace)`, `back()` (logical parent: audit→home, assemble→audit, interview→leave dialog→assemble, reel/wrapped→verdict, verdict/huddle→home), and a popstate handler that never re-enters a finished interview (redirects home) and asks before leaving a live one (`leaving` → LeaveDialog with Keep interviewing / End & get verdict / Leave for now). Leaving keeps the session; the assemble screen then offers "Resume interview" without re-introductions, and `restoreInterview()` restores an open question, its coaching, or a pending Lifeline decision. `BackButton` lives in primitives.
- `components/pp/stage.tsx`: **stage geometry** (`useStageGeometry` / `stageGeometry(w, h, {clamp})`). `room.png` is 3:2; chair-back centers x = 0.235 / 0.499 / 0.771, chair tops y ≈ 0.31, table edge y = 0.64. Figures are 0.2 × imgW wide (clamped 150–400; Priya ×1.06 and anchored further left, because the left chair is drawn turned toward the center so its seat sits left of its backrest), anchored per seat on the head/torso centerline, bottoms at y ≈ 0.67, so they sit *in* the chairs. `RoomBackdrop front={geo}` redraws only the tabletop **over** the figures so the table hides their laps (render order: backdrop → figures → front backdrop → name plates/bubbles). `figureTop(seat)` is the anchor for bubbles and cards. SeatFigure renders as a button only when it has `onClick`.
- `components/pp/panel-preview.tsx`: the landing page's silent scripted loop (Marcus/Leo/Priya ask, the student answers, rings/deltas/map lines update) built from the real stage components.
- `components/pp/bubble.tsx`: speech bubble with karaoke captions. It is measured with ResizeObserver so it never goes under the top bar. In feedback mode it shows the reaction, delta, "Because you said…" (with a "your words" badge if verified) and feedback.
- `components/pp/resume-map.tsx`: Defensibility Map plus MapTally (segmented bar). Scrolls only its own list (see quirks).
- `components/pp/answer-dock.tsx`: mic, waveform, textarea, send, Lifeline, demo "Play Maya's answer", decision row (Use Lifeline / Move on), auto-advance timer (6 s).
- `components/pp/peek.tsx`, `coach.tsx`, `top-bar.tsx`, `journey.tsx`, `primitives.tsx` (ScoreRing, AnimatedNumber, ReactionChip, StatusIcon, Avatar face-crop, icons).
- `components/pp/screens/*.tsx`: one file per screen. `app/page.tsx`: screen router, busy overlay with rotating steps, error toast, `booted` flag (no home-screen flash when restoring `?s=`).

---

## 6. Engine rules (the "trustworthy AI" story)

- **Scoring bands (server-owned):** impressed [+8, +12, +16], neutral [0, +2, +4], probing [−2, +1, +4], skeptical [−4, −8, −12]. The model returns `band` and `strength` (1–3).
- **Line status consistency:** impressed → green, skeptical → red, otherwise the model's choice (never red).
- **Evaluator is calibrated to the target level** ("judge against a strong *internship* candidate, not a senior engineer"). After a Lifeline, a retry that addresses the core doubt should be impressed or neutral.
- **Evidence:** the quote must appear verbatim (normalized). If not, the closest real sentence is substituted and `evidenceVerified=false` (no "your words" badge).
- **Lines tested:** the model's `lineIds`, else the concern's lineIds, else `linesMentioned()` (word overlap with resume lines). This matters because many concerns target *missing* skills that have no resume line.
- **Conversation flow (`planNext` in scoring.ts):** after an answer, if that interviewer still has budget they ask a **follow-up** (`followUpPrompt`: dig into one specific thing the student said, return a verbatim `anchor`); otherwise the next panelist who hasn't spoken **opens** (priority `0.5·(100−conf) + 8·openConcerns`), and the opener may pick up a thread from earlier answers (`anchor`, `buildsOn`). Anchors are verified verbatim (`verifyAnchor`) or dropped. Follow-up doubt = new doubt raised by the last answer, else the same doubt if still open, else the next open one (`followUpConcern`). There is no pre-generated follow-up queue anymore (`pendingFollowUp` was removed).
- **Lifeline:** one per interview. Offered (stage `awaiting-decision`) after a probing or skeptical first attempt; can also be used before answering. `coachPrompt` gets the full resume, the whole conversation, the interviewer's lookingFor and the student's answer, and returns `{ encouragement, missing[], outline[], tip }` (`Turn.coaching`); a flattened version goes to the evaluator, which is told that reading the points back without owning them is "neutral" at best.
- **Config:** live and demo sessions have maxTurns 6 and 2 questions per interviewer (opener + follow-up each); rematches have 3 turns and 3 questions (opener + 2 follow-ups).
- **Ending early:** `finish()` sets `session.endedEarly` when planNext still had moves. Panelists who never asked keep their resume-only confidence (it still counts in the average); the verdict card says "Didn't get to ask" and shows what they planned to ask. `strongestDomain` only counts panelists who actually asked.
- **Cross-panelist score updates:** Brijesh asked for them, then deferred them ("we will see this later", 2026-10-05). Not built; the evaluator still only resolves other panelists' doubts (`crossResolved`) without moving their scores.
- **Rematch:** keeps the resume line statuses and reopens only unresolved concerns. A `recap` of the earlier Q&A goes into the question prompt so it doesn't repeat questions.
- **Stats:** linesDefended (green), linesPartial (yellow), linesShaky (red), linesTested, biggestGain, comeback (positive retry delta), toughestCritic (lowest final, tie → lowest start), strongestDomain.
- **Privacy:** PII is redacted before any AI call. Sessions can be deleted from the verdict and Wrapped screens. Verdicts are never "rejected" and are never shared.

---

## 7. ASU CreateAI: verified facts (important)

Verified on 2026-10-05 with Brijesh's **project service token** (docs: https://docs.aiml.asu.edu, which has `.md` versions of each page).

- **Token:** stored in `panel-prep/.env.local` as `CREATEAI_API_KEY` (the code also accepts `CREATEAI_ACCESS_TOKEN`), plus `CREATEAI_QUERY_URL=https://api-main.aiml.asu.edu/query`.
  - It is a service token for Brijesh's **`edplus-video`** CreateAI project, not a dedicated Panel Prep project.
  - It was pasted in chat, so **recommend rotating it after the hackathon.**
  - **Never write the token into any committed file.**
- **One endpoint for everything:** `POST /query` with `Authorization: Bearer <token>`.
- **System prompts only apply with `request_source: "override_params"`.** Without it, `model_params.system_prompt` is silently ignored (tested with an "answer in French" system prompt). Brijesh's other project used a flat `{"query": ...}` payload with the system prompt prepended into the query.
- **Text response:** `{ "response": "<string>", "metadata": {...usage_metric...} }`. `response_format: {type:"json"}` works.
- **Model override:** `model_provider:"openai", model_name:"gpt4o"` works (it costs more, which confirms the override is honored). Omitting the model uses the **project's default model** (cheaper and faster; probably a gpt-4.1-mini-class model, unconfirmed).
- **Speech (TTS):** `{endpoint:"speech", request_source:"override_params", agentic:false, model_provider:"openai", model_name:"tts1", voice, query}` returns **base64 MP3 in `response`**. Voices: alloy, echo, fable, onyx, nova, shimmer.
- **Audio (STT):** needs `{action:"query", endpoint:"audio", query:"transcribe this", audio_file:<base64>, model_provider:"openai", model_name:"whisper-1"}`. Without `action` and `query` it returns a 500. **WebM/Opus (browser recordings) works.**
- Every call also sends `enable_history:false, enable_search:false`, so the project's chat history or knowledge base can't leak in.
- **Rate limit:** the project has a **tokens-per-minute limit**. Testing pushed it to 123%. Errors come back as HTTP 500 with `error_type: "rate_limit"`. The app throws `RateLimitError` → retries once after 8 s → returns HTTP 429 with a friendly message. TTS falls back to browser voices. **Risk at the event** if judges run back-to-back live sessions: suggest a dedicated CreateAI project or a limit increase, and use demo mode for the pitch.
- **Measured latencies:**

  | Step | Fast tier (project default) | gpt-4o |
  |---|---|---|
  | Audit | ~4.6 s | ~12 s |
  | Panel | ~6 s | ~13–15 s |
  | Question | ~2.4 s | — |
  | Evaluate | ~3–4 s | 6–12 s |
  | Huddle/finish | ~6 s | ~12–13 s |
  | TTS (per line) | ~3.6 s fresh, 39 ms cached | — |
  | Transcribe | ~2 s | — |

- **Model routing** (`lib/server/llm.ts` `FAST_TASKS`):
  - **Fast** (`CREATEAI_FAST_MODEL_NAME`, default `project-default`): audit, question, evaluate, coach.
  - **Deep** (`CREATEAI_MODEL_NAME`, default `gpt4o`): panel, huddle.
  - gpt-4o writes noticeably sharper join reasons and huddle lines. The fast model is better calibrated on internship answers.
- The fast model once emitted `[L2, L3]` (unquoted IDs). `parseJSON` repairs this, plus trailing commas.
- `npm run check:createai` checks query, speech and transcription in one go.

---

## 8. Demo mode (Maya)

- **Maya Reyes:** a fictional first-gen sophomore, Frontend Developer Internship. 12 resume lines (L1–L12).
  - L4 "Deployed the portfolio on AWS" = gap.
  - L6 StudyBuddy "team of 3" = shaky.
  - L12 "Jest (familiar)" = gap.
- **Panel:**
  - **Priya Raman:** Frontend Lead, seat 0, starts at 62.
  - **Leo Park:** QA Engineer, seat 1, starts at 42.
  - **Marcus Hale:** DevOps Engineer, seat 2, starts at 35.
- Demo turns are **named beats** (`Turn.script`, set from the question/follow-up fixture). Keys: openers `question:<interviewerId>:1`; follow-ups `followup:<beat>:<attempts of the previous turn>`; `evaluate:<beat>:<attempt>`; `coach:<beat>`. `Turn.coachable` is false where no coach fixture exists (Lifeline disabled there in the demo). Maya's scripted answers live in `lib/demo.ts`, keyed `<beat>:<attempt>`. Fixtures are raw model output, so they go through the real engine.
- **Main scripted path (6 questions):**
  1. **Marcus** opener `m-aws` (AWS deploy): vague → **skeptical −8** → Lifeline (Sam's outline) → retry → **impressed +16**.
  2. **Marcus** follow-up `m-cache` on "CloudFront sits in front of the bucket" → **impressed +8**.
  3. **Leo** opener `l-jest` ("Building on your deploy story with Marcus…") → **probing +1**.
  4. **Leo** follow-up `l-ui` on "I haven't really tested the React components themselves yet" → **neutral +4**.
  5. **Priya** opener `p-context` (builds on Leo, StudyBuddy) → **impressed +12**.
  6. **Priya** follow-up `p-team` on "I owned the scheduling screens and this state setup" → **impressed +8**.
  Result: **Almost There 60%** (Priya 82, Leo 47, Marcus 51).
- **Alternate branches covered:** Move on after Marcus's opener → follow-up `m-upload` ("I followed a tutorial…", probing, has its own Lifeline + retry); Lifeline on Leo's opener → follow-up `l-edge` (edge cases); Lifeline before answering Priya (`coach:p-context`).
- **Demo debrief is assembled, not scripted:** `demoDebrief()` in maya.ts builds the huddle, Sam's summary, practice, drills and per-interviewer notes from the beats that actually happened (`DEBRIEF` keyed `<beat>:<attempts>`, `UNASKED` lines for panelists who never asked, closing line by verdict). So ending after one answer gives an honest debrief.
- **"Play Maya's answer"** chips type the scripted answers. Typed answers also work, and the evaluation still uses the fixture; the evidence check then substitutes the student's real sentence (follow-up anchors are then dropped).
- **Sample history:** two earlier sessions (`sample: true`, 38% and 46%) are seeded on the first demo run so the journey chart has a trend. They're labelled "sample".
- **Demo voices:** `npm run warm:demo` (with the app running) generates all 27 voice lines (intros, every scripted question and follow-up, Sam's coaching on each branch, and the huddle lines including early-end variants) and prunes unused files into `data/tts-cache` and copies them to **`assets/demo-voices/`** (committed, 2.1 MB). The TTS route checks there first, so a deployed demo has real voices even with no token.
- To capture a real session as a new demo script: run live with `RECORD_FIXTURES=1` (writes `data/recordings/<id>.json`).

### Staged pitch run: Ryan Brooks (added 2026-10-06, replaces Maya in the pitch)

Brijesh wanted a second scripted scenario that *looks live* to judges: Frontend role, Marcus ends happy and the middle-seat interviewer (Leo) gets more skeptical, so both reactions show at once. He presents by speaking Ryan's answers into the mic. He first chose no Lifeline (Move on twice), then asked to use the coach on Leo's second question. His choices then: the coached retry moves Leo to **Probing (+4), not won over**, and Sam stays **muted** while the presenter narrates his notes, to save time.

- **Trigger:** upload `~/Downloads/edplus-hackday/Ryan_Brooks_Resume.pdf` (one page, fictional, example.com contact details) through the normal live form, with Frontend Developer and **New Grad** selected. `stagedScenarioFor()` in `staged.ts` matches "ryan brooks" + "shelflife" in the resume text and sets `session.scenario = 'ryan'`. Mode stays `live`, so there are no demo chips or "sample" labels and the note says "Sam's note to you".
- **Engine:** `callJSON` replays `ryanFixture(key)` after realistic pauses (`stagedPause`: audit 2.4 s, panel 1.8 s, question 0.9 s, followup 1.1 s, evaluate 1.5 s, coach 1.6 s, huddle 1.8 s, plus up to 0.4 s of jitter). Any key the script doesn't cover goes to the live model, so going off-script keeps working.
  - `startTurn` sets `turn.script` for staged sessions too.
  - `finish()` uses `stagedDebrief()` when the script covers every asked beat; otherwise it runs the live huddle prompt.
  - A rematch clears the scenario.
- **Answer dock:** staged sessions skip Whisper and keep only the browser's live captions, because the reactions are scripted anyway. The mic status line follows the same `serverSTT` flag.
- **Script:** the panel starts at Priya 58, Leo 44, Marcus 50.
  1. Leo `l-cov` (the 90% coverage claim) → **probing −2** → Move on.
  2. Leo `l-snap` (anchor "mostly snapshot tests": would any test catch a broken Add item button?) → **skeptical −8**, and L7 turns red → **Use Lifeline** (`coach:l-snap`: what was missing + two outline steps) → retry (`evaluate:l-snap:2`) → **probing +4**, L7 yellow, Leo: "That's the right test. Now I want to see it written."
  3. Marcus `m-ci` (builds on Leo: CI with preview deploys) → **impressed +12** (evidence "the merge button stays blocked") → End interview.
  - Pitch result: **Rising Star 53%** (Leo 38, Marcus 62, Priya 58 never asked), 17 points from Interview Ready. Sam's note: went well = the coached comeback (`l-snap:2` coach line), held back = `l-cov:1` (snapshot tests), next step = `l-cov:1.next` (write the RTL test).
  - Without the Lifeline (Move on twice), the run ends at **51%** with Leo still Skeptical; that path still works.
  - Optional 4th beat: Marcus `m-roll` (anchor "roll back in a minute") → impressed +8. After that, Priya's opener comes from the live model.
  - The debrief falls back to a beat's `:1` version when there's no `:<attempts>` beat, so a Lifeline anywhere else still gets a scripted ending, but its coaching and retry score come from the live model.
- **Ryan's answers:** these are in the pitch doc word for word. The quoted phrases must stay verbatim substrings, or the "your words" badge and follow-up anchors drop:
  - A1: "Honestly, they're mostly snapshot tests. That's how I got to ninety percent. They caught a few layout changes when I refactored."
  - A2: "Probably none of them. The snapshot would still match, because the page looks the same."
  - A2 retry, after Sam's notes: "Fair point: snapshots only check how the page looks. I'd add a test that types an item, clicks Add item, and checks the list." (evidence "clicks Add item, and checks the list")
  - A3: "Every pull request runs lint and tests, and if anything fails, the merge button stays blocked. Otherwise Vercel posts a preview link. Merging to main ships it, and I can roll back in a minute."
  - A4: "Our error tracker alerts us. Last month a missing environment variable broke the calculator. The alert fired within two minutes, and I rolled back before most users noticed."
- **Voices:** `warm:demo` also walks Ryan's run through the live form five times (`RYAN_PATHS`: stopping after 1, 2 and 3 answers, and the Lifeline path stopping after 2 and 3), for 39 lines in total in `assets/demo-voices`. Sam's Lifeline line is voiced even though the pitch mutes it.
  - Lengths: Leo's questions 8.1 s and 9.8 s, Marcus's 9.5 s and 5.2 s, huddle lines 5–7 s.
  - After editing `ryan.ts` (FIXTURES are raw model output; BEATS/UNASKED/CLOSING feed the debrief), re-run `warm:demo`.
- **Honesty line:** the pitch never calls the run "live". Slide 3 says "Ryan is a sample student. I'll answer as him." If a judge asks, say it's a rehearsed run through the real engine and offer to run their resume live.
- **Rehearsal runs** are ordinary live sessions: they land in history and the Wrapped journey. Delete them afterwards if that matters.

---

## 9. Visual design system

- **Theme tokens:** `app/globals.css`. Stage `#0b0e1f`, surfaces `#141833` / `#1c2147`, gold `#FFC627` (coach and verdict), maroon `#8C1D40` (Wrapped and the PDF header), status good `#22C55E`, warn `#F59E0B`, bad `#F87171`.
- **Verdict screen theme:** the app's own navy, one step lighter (`.lift-bg` page gradient `#1c2149 → #15193b`, `.lift-card` cards). Brijesh rejected a light ASU/maroon version: every screen stays in the same theme. The ASU maroon-and-gold style lives only in the PDF report, which he likes.
- **Icons:** **Phosphor** (`@phosphor-icons/react`, use the `*Icon` names; v2.1 deprecates bare names), duotone for meaning, bold for arrows/close. Brijesh asked for icons that "clearly signify". Mapping: reactions ThumbsUp / MinusCircle / MagnifyingGlass / SealQuestion; map statuses ShieldCheck / ShieldWarning / ShieldSlash / CircleDashed; verdicts Trophy (Ready) / Mountains (Almost) / Barbell (Keep Practicing). Lucide remains only in unused `components/ui/*`.
- **Logo (2026-10-06):** Brijesh's app icon `public/AIInterviewPanelIcon.png` (1254 px master, three glowing interviewer cards facing a student; its corners were white, no alpha). Derived files with transparent rounded corners: `public/logo.png` (192 px, the `Logo` component in primitives: 30/38/44 px with a hairline ring, because its navy matches the stage), `public/logo-report.png` (160 px, PDF header via `loadLogo()`; the report still renders without it), `app/icon.png` (256 px favicon) and `app/apple-icon.png` (180 px, navy-filled corners). Also on the Wrapped card and at the top of the README. Regenerate from the master if it changes; don't reference the 1.3 MB master directly.
- **Fonts:** Space Grotesk (display), Inter (UI), JetBrains Mono (micro labels), loaded via `next/font`.
- **Utility classes:** `.glass`, `.glass-soft`, `.gold-btn`, `.text-gradient-gold`, `.grid-bg`, `.ripple`, `.tnum`.
- **Motion:** spring entrances, animated numbers, floating deltas, 320 ms expression crossfades. `prefers-reduced-motion` is respected.
- **Backgrounds:** home hero is dark with maroon/gold glows + grid; the form section uses `preboardroom.png`; audit uses a grid; the interview screen shows a crisp room in the stage area and a blurred room behind the map panel; verdict is light paper.
- **Home:** hero (headline + "Build my panel" scrolls to the form + "Watch Maya's session") beside `PanelPreview`; a proof strip (11 / 3 / 1 / 0); "How it works" (4 steps); "Build your panel" form section; footer.
- **Huddle:** interviewers stay in their chairs (no slide-together), the speaker gets a glow and a white bubble with karaoke captions, the others dim and lean ~1.6° toward them. Faces show each interviewer's **real final reaction** (happy stays happy, skeptical keeps the facepalm). Brijesh explicitly wants this; don't soften it. Ends with a "Your verdict is sealed" card + optional transcript.
- **Verdict:** hero (medallion, verdict icon + label, a 3-zone scale with a "You" marker and "N points from the next level"), KPI tiles that each explain themselves (lines defended; biggest comeback/win "with X"; strongest area in that interviewer's color with "X ended N% convinced, your highest"; "next to win over" = the least-convinced interviewer, with "The least convinced, at N%. Still doubts: <probed or open concern>"), interviewer cards with a start-to-end dumbbell, map card (untested lines collapsed), Sam's debrief, plan checklist + drills, action cards.
- **Wrapped journey:** headline sentence ("Up N points in K sessions"), 4 stat tiles, an area chart with verdict-zone bands and right-side zone labels (Session 1..n on the x axis, endpoints labeled, hover tooltip, table view), and per-skill dumbbell rows (first time vs latest, "Ready at 70" tick). Follows the dataviz skill (single series = emphasis, dumbbell for before/after).
- **Interview layout:** map panel 330/370/420 px wide (by viewport); Sam's card sits beside the dock when the stage is ≥1000 px wide.
- **Accessibility:** reactions have icon + label + color; map statuses have icons; captions are always on; the journey chart has a table view; voice and sound can be toggled in the top bar (preferences in localStorage `panel-prep:prefs`).

---

## 10. Testing notes and quirks

- **Fully tested in the in-app browser:**
  - Demo end to end, including Lifeline, Move on, early Wrap up, Peek, refresh-resume, verdict, reel, Wrapped PNG export and the PDF (3 pages for a full run, 2 when ended early).
  - Live mode end to end with a pasted resume: audit, panel, questions, evaluation, follow-up, huddle, verdict, rematch.
  - TTS and transcription endpoints via curl.
  - Production `next build` passes with TypeScript checking on (`ignoreBuildErrors` was removed).
- **Browser-pane quirks:**
  - A hidden or background pane throttles `requestAnimationFrame`/timers, so animations stall unless you take screenshots. Drive the app with screenshot-interleaved batches, not long JS scripts.
  - `computer type` didn't reach the React textarea; **`form_input` works**.
  - The HMR websocket fails in the pane, so reload manually after edits (the session restores via `?s=`).
  - **Don't let Claude's preview own the server.** The desktop app stopped the preview's `next dev` without warning ("was stopped by the app"), which took Mockify down mid-use. Since 2026-10-06, `edplus-hackday/.claude/launch.json` only *attaches* to `http://localhost:3100` (url mode, no command). The server runs in Brijesh's Terminal: `npm run dev -- -p 3100` in `panel-prep/`. Keep port 3100, because the mic permission and the `panel-prep:prefs` localStorage are tied to that origin.
- **Fixed bugs worth remembering:**
  - `scrollIntoView` and focus scrolled the fixed `overflow-hidden` screen root. Screens now use **`overflow-clip`**, and the map scrolls only its own list.
  - The feedback bubble could slide under the top bar; it now measures itself and clamps its top to 76 px.
  - The Peek panel was see-through (now a solid background).
  - The Coaching Report PDF uses WinAnsi standard fonts, so avoid "→"-style Unicode in its text.
- **Test resumes used:** fictional "Alex Rivera" (backend PDF generated with jsPDF) and "Jordan Lee" (pasted mobile resume). Test sessions were deleted afterwards; the DB is clean.

---

## 11. Commands (run in `panel-prep/`)

```bash
npm install
npm run dev                 # http://localhost:3000 (Claude used -p 3100 during this session)
npm run check:createai      # verify token, model, speech, transcription
npm run warm:demo           # with the app running (BASE=http://localhost:3100 if not on 3000)
npm run build               # production build (type-checked)
```

---

## 12. Status, known issues, and next steps

**Status:** feature-complete for the hackathon. Both demo and live modes work.

**Known issues and limits:**

- **CreateAI rate limit** (see section 7): the biggest live-demo risk.
- **Vercel:** the SQLite file doesn't persist there. Set `DATABASE_URL` / `DATABASE_AUTH_TOKEN` to Turso/libSQL. Voices are fine via `assets/demo-voices`.
- **Ending early in live mode** waits about 12 s for the gpt-4o verdict. The overlay shows progress steps. The natural interview end prefetches the verdict.
- **Not built** (cut for scope):
  - Realistic timed mode.
  - Interactive drill sessions (drills are only listed).
  - Job-posting-specific employer tuning beyond the prompt.
  - Mobile-phone layout polish. Desktop/projector is the target; test on the venue screen for contrast.
- `components/ui/*` (shadcn) is mostly unused, left over from the original.
- `panel-prep` is a git repo pushed to **https://github.com/Brijesh03032001/panel-prep** (branch `main`, first pushed 2026-10-05 as 6 commits). Commit as `Brijesh03032001 <sainibrijesh01@gmail.com>` (set in the repo's local config) with plain, human-sounding messages and **no Co-Authored-By or other AI trailers**. Push with `git -c credential.helper='!gh auth git-credential' push` (gh is logged in). **Never commit `.env.local`** (it's gitignored via `.env*`; `.env.example` is allowed); `/data` (DB, recordings, TTS cache) is ignored too.
- Brijesh's other app (`lost-in-the-switch`, port 3000) may have been stopped by a cleanup command. He was told; he may need to restart it.

**Ideas, if asked:**
- A pitch deck or slides from the project document.
- Rehearsal of the 3-minute demo script (in the README and the project doc).
- Rotating messages or coach tips during waits.
- A dedicated CreateAI project and rate-limit increase.
- An "Interview Ready" demo path (current fixtures land on Almost There 53%).

---

## 13. Timeline of what was done (2026-10-05)

**Second pass (same day): UI redesign from Brijesh's feedback.** He said the landing page wasn't impressive enough, the interviewers didn't line up with the chairs behind them, the huddle and verdict needed more polish, the verdict was too dark and needed clearer icons, the Wrapped charts didn't clearly say what they meant, and the report should be short enough to actually read. Done: re-measured chair geometry + table-front occluder; huddle redesign; verdict redesign (first light ASU-style, then back to the app's navy at his request); Phosphor icons app-wide; journey redesign; landing page with live panel preview; two-page report. `next build` passes. Test sessions created during this pass were deleted (his own demo runs were kept).

Follow-up feedback: keep the verdict in the app's theme (just a bit lighter), explain why someone is "next to win over", and restore the real emotions in the huddle. All three were done.

**Sixth pass (2026-10-06):** the middle readiness level is now **"Rising Star"** (was "Almost There"; shooting-star icon; repo.ts upgrades old saved labels on read). Results page: no 60-second drills; "Keep going" order is Panel Prep Wrapped, Coaching Report, Highlight Reel. A one-page report rewrite was tried and Brijesh rejected it: the PDF is where the detail lives that the results page no longer shows. (Superseded by the seventh pass below.)

**Seventh pass (2026-10-06): Coaching Report rebuilt.** Brijesh said strengths were "not at all visible" and asked for the best report with all the earlier content recovered. Layout now:
- **Page 1, the summary:** readiness gauge and scale, four numbers, then two equal panels side by side: **YOUR STRENGTHS** (green, check marks: each panelist's `strongest` with their confidence gain, a "Bounced back after a tough first answer" item from `stats.comeback`, and "Backed up N resume lines"; max 4) and **WHAT TO WORK ON** (amber, "!" marks: `criteriaMissed[0]` from the weakest answers, then each panelist's unresolved doubt rewritten to "you"; max 4). Sam's three-part note closes the page.
- **Page 2, the plan and the panel:** Practice this week, 60-second drills, How each interviewer saw you, and the **Defensibility Map** (restored: tested lines with pills plus an untested count).
- **Page 3:** question by question (question, first try, "You said" quote in the reaction color, feedback, Showed/Missing).
- Full six-question demo = 3 pages; ended after one question = 2 pages. If Sam's note ever spills off page 1, page 2 continues on that page instead of leaving it nearly empty.
- The report blurbs on home and results no longer promise a page count.

**Pitch script (2026-10-06).** Brijesh asked for a 4.5-minute one-sided pitch: slides, a timed speaker script, demo narration and a 20-second close.
- **Where it lives:** a Claude Doc, "Mockify — 4.5-Minute Demo Pitch" (https://claude.ai/artifact/8UaoQjYa6m32amDzgMdA6C; it said Panel Prep until the rename). Local copies are `Mockify — 4.5-Minute Demo Pitch.md` / `.docx` in edplus-hackday/; images are in `pitch-assets/` (run-of-show, panel-seated, ryan-* screenshots including ryan-sam-notes and ryan-leo-after-lifeline).
- **Narration voice:** Brijesh rejected the first draft's narration as robotic, so every spoken line is conversational.
- **Demo is now Ryan's staged run** (section 8), replacing Maya. The plan runs about 4:23, leaving about 7 s of buffer:
  - Hook "Walk me through that." with the "ninety percent test coverage" line.
  - Intro (no "this isn't a mockup" claim any more, since the run is staged).
  - Demo 1:16–3:32: upload the PDF → resume check → Skip introductions → Leo −2 → Move on → Leo −8 → mute + Use Lifeline → retry → Leo +4 → unmute + Next question → Marcus +12 → "Now look at the panel" → End interview → Skip huddle.
  - Results 3:32–3:56 (Rising Star 53%).
  - Close "So the next time Ryan hears 'walk me through that,' it won't be the first time. That's Mockify."
  - The timeline was computed beat by beat: narration at 140 wpm, Ryan's answers at 150 wpm, measured voice lengths, staged pauses and click time.
- **Presenting gotchas:**
  - Auto-advance has no UI toggle. Set `autoAdvance: false` in localStorage `panel-prep:prefs`, or Marcus's follow-up starts 6 s after his reaction, over the narration.
  - Chrome's live captions need Wi-Fi. The scripted questions and voices are on disk.
  - The Lifeline doesn't wait for Sam's voice: `takeLifeline()` opens the answer box straight away and plays his line in the background, and clicking the mic stops it. That's why muting (top-bar speaker icon, "Mute interviewer voices") saves the full ~12 s. Unmute before Next question so Marcus is heard.
  - After stopping the mic, focus returns to the textarea, so Enter sends.
- **Maya demo leftovers (not in the pitch any more):**
  - "Play Maya's answer" leaves focus on the body, so Enter does nothing there.
  - Sam's spoken Lifeline says "Then, then…" because `coachSpeech()` adds First/Then/Finally to outline steps that already start with "Start with / Then / Finish with". A fix needs `npm run warm:demo` to re-voice the line.
  - The Wrapped readiness journey plots the last 8 sessions, so test runs push the two sample sessions off the chart.
- **Stats in the project doc are outdated:** ASU now reports 40% of undergrads as first-generation (asu.edu/about/facts-and-figures, 2025–26) and 119,300+ ASU Online students (ASU News, Aug 10, 2026).
- With the rebuilt report, the 2-question pitch path makes a 3-page PDF whose page 3 holds only Q2.


**Fifth pass (2026-10-06): results page trimmed.** Brijesh removed the four stat cards (lines defended / comeback / strongest area / next to win over) and the Defensibility Map card from the results page; don't bring them back there. Results now: readiness hero → "How each interviewer saw you" → **Sam's note** beside "Your plan this week" → "Take your session with you". Sam's note (`CoachNote`): titled "Sam's note to Maya" in the demo ("to you" live), explains that Sam coached the student and wrote it after the panel finished, quotes the best moment (highest-delta answer's evidence quote, who it impressed, +N), then **What went well / What held you back / Your next step** from `Outcome.coach` (live: huddle prompt `coach`; demo: `demoDebrief` using each beat's `coach` and `held` text). Old sessions fall back to `coachSummary`. The PDF mirrors this: page 1 = readiness, numbers, Sam's note (three parts), strongest moments, practice this week; page 2 = drills, interviewers, question by question (compact, 9 pt). The Defensibility Map was dropped from the PDF too, to stay at 2 pages with 6 questions (restored in the seventh pass).

**Fourth pass (2026-10-06): content and liveliness.**
- **Landing:** headline "Practice your interview with an AI panel that has read your resume."; pill "AI mock interviews for students"; CTAs "Start my mock interview" and "Try the demo"; the numbers strip and "Runs on ASU CreateAI" were removed at Brijesh's request (keep them out).
- **Resume (audit) screen:** renders like a real resume: centered name (demo only, `resume.title`; live resumes never store a name), section headings with rules, entries (`ResumeLine.entry` = { title, detail, date }, from the audit prompt) with bullets, skills as "Label: values". Checklist reworded in plain language.
- **Panel intro:** interviewers introduce themselves (`Interviewer.intro`, from the panel builder, first person, who they are). Never say why they were picked: Brijesh says real interviewers don't. `joinReason` is only shown in Peek.
- **Speaking interviewer:** `voice.level()` measures real TTS loudness (AnalyserNode; needs `voice.unlock()` from a user gesture) or a `speechRhythm` stand-in; `SeatFigure` lifts/swells with it, a color aura pulses, bars follow the voice; status chips Listening / Thinking; idle `.breathe` animation; the interview "camera" eases toward whoever has the floor (scale 1.04 while asking).
- **No "verdict" anywhere in the UI:** use "results" (buttons/links: "See my results", "End interview & see my results", "Back to results") and "interview readiness" (headline concept). Screen key and URL are `results` (component `ResultsScreen` in `screens/results.tsx`). The huddle prompt tells the model not to say "verdict". Internal DB/types still use `verdict`.

**Third pass (2026-10-05/06): conversational interview.** Brijesh asked for a natural flow (questions driven by his answers), a context-aware coach that says what to improve and how to answer, live captions while speaking, Priya seated properly, back navigation everywhere, and an early "End interview" for the 2-minute pitch. Decisions he made: coach = outline from your resume (not a full script); live captions = instant browser captions; 2 questions per panelist (opener + follow-up) for demo and live; cross-panelist scoring deferred. All built and tested via API (all demo branches + early ends) and in the browser; `next build` passes. Not committed or pushed yet.

**Third pass (same day): architecture diagrams.** The README's ASCII sketch was replaced with three Mermaid diagrams (GitHub renders them): the system map, the session journey (Prepare → Interview room → Debrief), and a sequence diagram of one answer. They use a dark navy card styled in the app's colors (violet browser, teal API, gold engine, orange storage, maroon/gold CreateAI) so they read on GitHub's light and dark modes. Verified on Mermaid 10 and 11. Then added **`docs/SYSTEM_DESIGN.md`** (requirements, layers, deployment, data model, session states + API table, engine rules, AI gateway, latency budget with a gantt, failure modes, privacy, scaling to a pilot, trade-offs) with 5 more diagrams, and **`scripts/render-diagrams.mjs`**, which renders every block tagged `<!-- diagram: name -->` in README.md and docs/*.md to `docs/diagrams/<name>.png` (8 PNGs, 2x, on navy `#0b0e1f`). Gotchas: Mermaid ignores a subgraph's `direction` when its inner nodes link outside, so link at subgraph level; don't set `fontFamily` in the init block (labels got clipped); avoid back-edges between subgraphs (they reorder the rows); `call` is a reserved node id; gantt bars need `after <id>` + durations (`4s`) with `dateFormat X`; mmdc's own Chrome isn't installed, so the script passes the installed Google Chrome via a puppeteer config. mermaid.live links were blocked by the permission classifier as public data sharing; don't retry that.

**Parallel work warning (2026-10-05, ~23:40):** another Claude session ("Landing page and verdict design improvements") was mid-way through reworking turn-taking (`scoring.ts` `planNext`, follow-ups that quote the student's words, structured Lifeline `Coaching`; `engine.ts` not yet updated). The design doc describes turn planning generically for that reason. The README's "Explainable turn order" formula bullet will be stale once that lands.

**Dev-server quirk:** Turbopack sometimes keeps serving stale `globals.css` after an edit, and a `touch` doesn't help. A real content change to the file forces a recompile. Check the served CSS chunk if a new utility class seems to have no effect.


1. Read the original Shadow Committee app and proposed a reskin. Brijesh redirected to **student interview prep with domain personas** and shared the full project document.
2. First build attempt: Brijesh stopped the SVG-avatar idea, chose to keep the art, and asked for a real backend and deep thinking. Claude researched CreateAI docs, then designed the server-authoritative engine. Brijesh chose **Next.js + DB** and **CreateAI**.
3. Built the backend (types, engine, scoring, prompts, DB, CreateAI client, demo fixtures, API routes) and smoke-tested the demo via curl.
4. Built the frontend (store, voice, recorder, sfx, primitives, stage, map, bubble, dock, coach, peek, top bar; screens: home, audit, assemble, interview, huddle, verdict, reel, wrapped, journey; PDF report).
5. Browser-tested and polished (layout fixes, coach placement, bubble clamping, overflow-clip, booted flag, label and copy fixes, chart labels). Brijesh paused everything for his own interview, then said continue.
6. Brijesh provided the CreateAI token. Claude probed the real API shapes, fixed the client (override_params, audio format, isolation flags), added model tiering, JSON repair, the lines-mentioned fallback, level-calibrated evaluation, rematch recap, reaction-aware coach copy and verdict prefetch. Claude found the **rate limit** and added graceful handling.
7. Added `check:createai` and `warm:demo`. Pre-generated and committed the demo voices. Wrote the README and `.env.example`. Cleaned the test data. Left the dev server running on port 3100.
