"use client"

import { create } from 'zustand'
import { api, type TurnResponse } from './api'
import { COACH } from './catalog'
import { sfx } from './sfx'
import type { AppConfig, Coaching, EvalResult, SessionDoc, SessionSummary, Turn } from './types'
import { voice } from './voice'

export type Screen = 'home' | 'audit' | 'assemble' | 'interview' | 'huddle' | 'results' | 'reel' | 'wrapped'
export type Stage = 'idle' | 'asking' | 'answering' | 'evaluating' | 'feedback' | 'decision' | 'hinting' | 'finishing'

export interface Beat {
  id: number
  turnId: string
  interviewerId: string
  attempt: number
  result: EvalResult
}

export interface CoachMsg {
  kind: 'welcome' | 'offer' | 'hint' | 'cheer' | 'thinking'
  title?: string
  text: string
  coaching?: Coaching
  /** Coaching asked for before answering, so "missing" describes what the interviewer wants to hear. */
  before?: boolean
}

interface Prefs {
  voice: boolean
  sound: boolean
  map: boolean
  autoAdvance: boolean
}

interface State {
  booted: boolean
  config: AppConfig | null
  screen: Screen
  session: SessionDoc | null
  turn: Turn | null
  stage: Stage
  beat: Beat | null
  queued: Turn | null
  ended: boolean
  coach: CoachMsg | null
  error: string | null
  busy: string | null
  peekId: string | null
  prefs: Prefs
  recordings: Record<string, string>
  history: SessionSummary[] | null
  /** Set while the student is confirming they want to leave a live interview. */
  leaving: Screen | null

  init: () => Promise<void>
  startDemo: () => Promise<void>
  startLive: (form: FormData) => Promise<void>
  buildPanel: () => Promise<void>
  go: (screen: Screen, opts?: { replace?: boolean }) => void
  back: () => void
  confirmLeave: () => void
  cancelLeave: () => void
  beginInterview: () => Promise<void>
  doneAsking: () => void
  submit: (answer: string, audioUrl: string | null) => Promise<void>
  takeLifeline: () => Promise<void>
  moveOn: () => Promise<void>
  advance: () => void
  wrapUp: () => Promise<void>
  rematch: (interviewerId: string) => Promise<void>
  reset: () => void
  deleteSession: () => Promise<void>
  loadHistory: () => Promise<void>
  setPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void
  setPeek: (id: string | null) => void
  dismissCoach: () => void
  clearError: () => void
}

const PREFS_KEY = 'panel-prep:prefs'
const DEFAULT_PREFS: Prefs = { voice: true, sound: true, map: true, autoAdvance: true }

function loadPrefs(): Prefs {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }
  } catch {
    return DEFAULT_PREFS
  }
}

// ─── Navigation ──────────────────────────────────────────────────────────────
// Every screen is a browser history entry (?s=<session>&v=<screen>), so the browser's back button and the
// in-app back buttons walk the same path. Screens that can't be revisited (a finished interview) are replaced.

const SCREENS: Screen[] = ['home', 'audit', 'assemble', 'interview', 'huddle', 'results', 'reel', 'wrapped']
let depth = 0

function writeUrl(id: string | null, screen: Screen, how: 'push' | 'replace', prev?: Screen) {
  try {
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('s', id)
    else url.searchParams.delete('s')
    if (screen === 'home') url.searchParams.delete('v')
    else url.searchParams.set('v', screen)
    if (how === 'push') depth += 1
    window.history[how === 'push' ? 'pushState' : 'replaceState']({ pp: depth, screen, prev: prev ?? null }, '', url)
  } catch {}
}

// Where "back" leads from each screen. A finished interview can't be re-entered, so its screens lead home.
function parentOf(screen: Screen, session: SessionDoc | null): Screen | null {
  switch (screen) {
    case 'audit':
      return 'home'
    case 'assemble':
      return session?.kind === 'rematch' ? 'home' : 'audit'
    case 'interview':
      return 'assemble'
    case 'reel':
      return 'results'
    case 'wrapped':
      return session?.outcome ? 'results' : 'home'
    case 'huddle':
    case 'results':
      return 'home'
    default:
      return null
  }
}

const inInterview = (s: SessionDoc | null) => Boolean(s && !s.outcome && s.turns.length > 0)

export const currentTurnOf = (s: SessionDoc | null) =>
  s?.current ? s.turns.find(t => t.id === s.current!.turnId) ?? null : null

// The results are generated as soon as the panel has heard enough, so it's ready by the time the student asks for it.
let pendingFinish: { id: string; promise: Promise<{ session: SessionDoc }> } | null = null
function finishSession(id: string) {
  if (pendingFinish?.id !== id) {
    const promise = api.finish(id)
    pendingFinish = { id, promise }
    promise.catch(() => {
      if (pendingFinish?.promise === promise) pendingFinish = null
    })
  }
  return pendingFinish.promise
}

const interviewStart = { turn: null, stage: 'idle' as Stage, beat: null, queued: null, ended: false, coach: null, peekId: null, leaving: null }

const coachFrom = (c: Coaching, before: boolean): CoachMsg => ({ kind: 'hint', title: c.encouragement, text: c.tip, coaching: c, before })

export const usePanel = create<State>((set, get) => {
  const fail = (err: unknown, patch: Partial<State> = {}) =>
    set({ error: err instanceof Error ? err.message : 'Something went wrong.', busy: null, ...patch })

  // Picks a live interview back up exactly where it stood, including a pending Lifeline decision.
  const restoreInterview = (session: SessionDoc) => {
    const turn = currentTurnOf(session)
    if (turn && session.current?.stage === 'awaiting-decision') {
      const last = turn.attempts[turn.attempts.length - 1]
      set({
        turn,
        stage: 'decision',
        beat: { id: Date.now(), turnId: turn.id, interviewerId: turn.interviewerId, attempt: turn.attempts.length, result: last.result },
        coach: offerMessage(last.result.reaction),
      })
      return true
    }
    if (turn) {
      set({ turn, stage: 'answering', coach: turn.coaching ? coachFrom(turn.coaching, turn.attempts.length === 0) : null })
      return true
    }
    return false
  }

  const show = (screen: Screen, how: 'push' | 'replace' = 'push') => {
    const { session, screen: prev } = get()
    if (screen !== 'interview') voice.stop()
    writeUrl(screen === 'home' ? null : session?.id ?? null, screen, how, prev)
    set({ screen })
  }

  // The browser moved to another history entry: follow it, unless that would re-enter a finished interview
  // or silently abandon a live one.
  const onPopState = async (e: PopStateEvent) => {
    const state = e.state as { pp?: number; screen?: Screen } | null
    const params = new URLSearchParams(window.location.search)
    const target = (state?.screen ?? (params.get('v') as Screen | null) ?? 'home') as Screen
    if (typeof state?.pp === 'number') depth = state.pp
    const { screen, session } = get()
    if (!SCREENS.includes(target) || target === screen) return
    if (screen === 'interview' && inInterview(session) && target !== 'interview') {
      writeUrl(session!.id, 'interview', 'push', target)
      return set({ leaving: target })
    }
    if (target === 'home') {
      voice.stop()
      return set({ screen: 'home', session: null, ...interviewStart })
    }
    const id = params.get('s')
    let s = session
    if (id && id !== session?.id) {
      try {
        s = (await api.getSession(id)).session
        set({ session: s, ...interviewStart })
      } catch {
        return show('home', 'replace')
      }
    }
    if (s?.outcome && (target === 'audit' || target === 'assemble' || target === 'interview' || target === 'huddle')) return show('home', 'replace')
    if (target === 'interview') {
      set({ screen: 'interview' })
      if (s && !restoreInterview(s)) void get().beginInterview()
      return
    }
    voice.stop()
    set({ screen: target })
  }

  const applyTurn = (res: TurnResponse) => {
    if ('turn' in res) {
      set({ session: res.session, turn: res.turn, stage: 'asking', beat: null, queued: null, coach: null })
    } else {
      set({ session: res.session, ended: true, stage: 'feedback' })
      void get().wrapUp()
    }
  }

  return {
    booted: false,
    config: null,
    screen: 'home',
    session: null,
    ...interviewStart,
    error: null,
    busy: null,
    prefs: DEFAULT_PREFS,
    recordings: {},
    history: null,
    leaving: null,

    async init() {
      window.addEventListener('popstate', e => void onPopState(e))
      const prefs = loadPrefs()
      voice.enabled = prefs.voice
      sfx.enabled = prefs.sound
      set({ prefs })
      const config = await api.config().catch(() => ({ live: false, tts: false, stt: false, provider: null }))
      voice.server = config.tts
      set({ config })
      const params = new URLSearchParams(window.location.search)
      const id = params.get('s')
      const wanted = params.get('v') as Screen | null
      if (!id) {
        const screen: Screen = wanted === 'wrapped' ? 'wrapped' : 'home'
        writeUrl(null, screen, 'replace')
        return set({ screen, booted: true })
      }
      try {
        const { session } = await api.getSession(id)
        set({ session })
        let screen: Screen
        if (session.status === 'audited') {
          screen = 'audit'
          void get().buildPanel()
        } else if (session.status === 'ready') screen = wanted === 'audit' ? 'audit' : 'assemble'
        else if (session.status === 'complete') screen = wanted === 'reel' || wanted === 'wrapped' ? wanted : 'results'
        else if (wanted === 'assemble' || wanted === 'audit') screen = wanted
        else {
          screen = 'interview'
          if (!restoreInterview(session)) void get().beginInterview()
        }
        set({ screen })
        writeUrl(session.id, screen, 'replace')
      } catch {
        writeUrl(null, 'home', 'replace')
      }
      set({ booted: true })
    },

    async startDemo() {
      sfx.unlock()
      voice.unlock()
      set({ busy: "Reading Maya's resume…", error: null })
      try {
        const form = new FormData()
        form.append('mode', 'demo')
        const { session } = await api.createSession(form)
        set({ session, busy: null, ...interviewStart, recordings: {} })
        show('audit')
        void get().buildPanel()
      } catch (err) {
        fail(err)
      }
    },

    async startLive(form) {
      sfx.unlock()
      voice.unlock()
      form.append('mode', 'live')
      set({ busy: 'Reading your resume…', error: null })
      try {
        const { session } = await api.createSession(form)
        set({ session, busy: null, ...interviewStart, recordings: {} })
        show('audit')
        void get().buildPanel()
      } catch (err) {
        fail(err)
      }
    },

    async buildPanel() {
      const s = get().session
      if (!s || s.panel.length) return
      try {
        const { session } = await api.buildPanel(s.id)
        if (get().session?.id === session.id) set({ session })
      } catch (err) {
        fail(err)
      }
    },

    go(screen, opts) {
      show(screen, opts?.replace ? 'replace' : 'push')
    },

    back() {
      const { screen, session } = get()
      if (screen === 'interview' && inInterview(session)) return set({ leaving: 'assemble' })
      const parent = parentOf(screen, session)
      if (!parent) return
      const st = window.history.state as { pp?: number; prev?: Screen } | null
      // When the previous history entry is the parent, step back for real so the browser stack stays honest.
      if (st?.prev === parent && (st.pp ?? 0) > 0) return window.history.back()
      if (parent === 'home') return get().reset()
      show(parent, 'replace')
    },

    confirmLeave() {
      const target = get().leaving ?? 'assemble'
      voice.stop()
      set({ leaving: null, coach: null })
      if (target === 'home') return get().reset()
      show(target, 'replace')
    },

    cancelLeave: () => set({ leaving: null }),

    async beginInterview() {
      const s = get().session
      if (!s) return
      sfx.unlock()
      voice.unlock()
      if (get().screen !== 'interview') show('interview')
      set({ ...interviewStart, coach: { kind: 'welcome', text: welcomeText(s) } })
      // Coming back to an interview already in progress: pick up the open question or decision as it was.
      if (s.current && restoreInterview(s)) return
      try {
        applyTurn(await api.startTurn(s.id))
      } catch (err) {
        fail(err)
      }
    },

    doneAsking() {
      if (get().stage === 'asking') set({ stage: 'answering' })
    },

    async submit(answer, audioUrl) {
      const { session, turn, stage } = get()
      if (!session || !turn || stage !== 'answering') return
      voice.stop()
      const attempt = turn.attempts.length + 1
      set(st => ({
        stage: 'evaluating',
        coach: st.coach?.kind === 'hint' ? st.coach : null,
        recordings: audioUrl ? { ...st.recordings, [`${turn.id}:${attempt}`]: audioUrl } : st.recordings,
      }))
      try {
        await api.answer(session.id, turn.id, answer, e => {
          if (e.type === 'result') {
            const updated = e.session.turns.find(t => t.id === e.turnId) ?? turn
            set({
              session: e.session,
              turn: updated,
              stage: 'feedback',
              coach: null,
              beat: { id: Date.now(), turnId: e.turnId, interviewerId: updated.interviewerId, attempt, result: e.result },
            })
            if (e.result.reaction === 'impressed') sfx.chime()
          } else if (e.type === 'decision') {
            set({ session: e.session, stage: 'decision', coach: offerMessage(get().beat?.result.reaction) })
          } else if (e.type === 'next') {
            const who = e.session.panel.find(p => p.id === e.turn.interviewerId)
            if (who) voice.prefetch(e.turn.question, who.voice)
            set({ session: e.session, queued: e.turn })
          } else if (e.type === 'end') {
            set({ session: e.session, ended: true })
            void finishSession(e.session.id).catch(() => undefined)
          } else if (e.type === 'error') {
            throw new Error(e.message)
          }
        })
      } catch (err) {
        fail(err, { stage: 'answering' })
      }
    },

    async takeLifeline() {
      const { session, turn } = get()
      if (!session || !turn || session.lifeline.used) return
      voice.stop()
      const before = turn.attempts.length === 0
      set({ stage: 'hinting', coach: { kind: 'thinking', text: 'Sam is reading your answer and your resume…' } })
      try {
        const res = await api.lifeline(session.id, turn.id)
        const updated = res.session.turns.find(t => t.id === turn.id) ?? turn
        set({ session: res.session, turn: updated, beat: null, stage: 'answering', coach: coachFrom(res.coaching, before) })
        sfx.pop()
        void voice.speak(coachSpeech(res.coaching), COACH.voice)
      } catch (err) {
        fail(err, { stage: get().beat ? 'decision' : 'answering' })
      }
    },

    async moveOn() {
      const { session, turn } = get()
      if (!session || !turn) return
      set({ stage: 'evaluating', coach: null })
      try {
        applyTurn(await api.moveOn(session.id, turn.id))
      } catch (err) {
        fail(err, { stage: 'decision' })
      }
    },

    advance() {
      const { queued, ended } = get()
      if (queued) set({ turn: queued, queued: null, beat: null, stage: 'asking', coach: null })
      else if (ended) void get().wrapUp()
    },

    async wrapUp() {
      const s = get().session
      if (!s || get().stage === 'finishing') return
      voice.stop()
      set({ stage: 'finishing', busy: 'The panel is conferring…', coach: null })
      try {
        const { session } = await finishSession(s.id)
        set({ session, busy: null })
        show('huddle', 'replace')
      } catch (err) {
        fail(err, { stage: 'answering' })
      }
    },

    async rematch(interviewerId) {
      const s = get().session
      if (!s) return
      set({ busy: 'Setting up your rematch…', error: null })
      try {
        const { session } = await api.rematch(s.id, interviewerId)
        set({ session, busy: null, ...interviewStart })
        show('assemble')
      } catch (err) {
        fail(err)
      }
    },

    reset() {
      voice.stop()
      set({ session: null, ...interviewStart, error: null, busy: null })
      show('home')
    },

    async deleteSession() {
      const s = get().session
      if (s) await api.deleteSession(s.id).catch(() => undefined)
      Object.values(get().recordings).forEach(url => URL.revokeObjectURL(url))
      set({ recordings: {}, history: null })
      get().reset()
    },

    async loadHistory() {
      try {
        const { sessions } = await api.history()
        set({ history: sessions })
      } catch {
        set({ history: [] })
      }
    },

    setPref(key, value) {
      const prefs = { ...get().prefs, [key]: value }
      if (key === 'voice') {
        voice.enabled = Boolean(value)
        if (!value) voice.stop()
      }
      if (key === 'sound') sfx.enabled = Boolean(value)
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
      } catch {}
      set({ prefs })
    },

    setPeek: peekId => set({ peekId }),
    dismissCoach: () => set({ coach: null }),
    clearError: () => set({ error: null }),
  }
})

function offerMessage(reaction?: string): CoachMsg {
  return {
    kind: 'offer',
    title: reaction === 'skeptical' ? 'That one slipped. It happens.' : "Good start. There's more in you.",
    text: "Want a second try? With your one Lifeline, I'll show you what was missing and how to answer, using your own resume.",
  }
}

function coachSpeech(c: Coaching) {
  const points = c.outline.map((o, i) => `${['First', 'Then', 'Finally'][i] ?? 'And'}, ${o.replace(/\.$/, '')}.`).join(' ')
  return `${c.encouragement} Here's how to answer. ${points}`
}

function welcomeText(s: SessionDoc) {
  return s.kind === 'rematch'
    ? `Rematch time. ${s.panel[0]?.name.split(' ')[0]} still has doubts. Show what you've practiced.`
    : "I'm Sam, your coach. Take a breath, think out loud, and use real examples from your own work. I'm here if you get stuck."
}
