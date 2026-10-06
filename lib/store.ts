"use client"

import { create } from 'zustand'
import { api, type TurnResponse } from './api'
import { COACH } from './catalog'
import { sfx } from './sfx'
import type { AppConfig, EvalResult, SessionDoc, SessionSummary, Turn } from './types'
import { voice } from './voice'

export type Screen = 'home' | 'audit' | 'assemble' | 'interview' | 'huddle' | 'verdict' | 'reel' | 'wrapped'
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

  init: () => Promise<void>
  startDemo: () => Promise<void>
  startLive: (form: FormData) => Promise<void>
  buildPanel: () => Promise<void>
  go: (screen: Screen) => void
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

function syncUrl(id: string | null) {
  try {
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('s', id)
    else url.searchParams.delete('s')
    window.history.replaceState(null, '', url)
  } catch {}
}

export const currentTurnOf = (s: SessionDoc | null) =>
  s?.current ? s.turns.find(t => t.id === s.current!.turnId) ?? null : null

// The verdict is generated as soon as the panel has heard enough, so it's ready by the time the student asks for it.
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

const interviewStart = { turn: null, stage: 'idle' as Stage, beat: null, queued: null, ended: false, coach: null, peekId: null }

export const usePanel = create<State>((set, get) => {
  const fail = (err: unknown, patch: Partial<State> = {}) =>
    set({ error: err instanceof Error ? err.message : 'Something went wrong.', busy: null, ...patch })

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

    async init() {
      const prefs = loadPrefs()
      voice.enabled = prefs.voice
      sfx.enabled = prefs.sound
      set({ prefs })
      const config = await api.config().catch(() => ({ live: false, tts: false, stt: false, provider: null }))
      voice.server = config.tts
      set({ config })
      const id = new URLSearchParams(window.location.search).get('s')
      if (!id) return set({ booted: true })
      try {
        const { session } = await api.getSession(id)
        set({ session })
        if (session.status === 'audited') {
          set({ screen: 'audit' })
          void get().buildPanel()
        } else if (session.status === 'ready') set({ screen: 'assemble' })
        else if (session.status === 'complete') set({ screen: 'verdict' })
        else {
          const turn = currentTurnOf(session)
          set({ screen: 'interview' })
          if (turn && session.current?.stage === 'awaiting-decision') {
            const last = turn.attempts[turn.attempts.length - 1]
            set({
              turn,
              stage: 'decision',
              beat: { id: Date.now(), turnId: turn.id, interviewerId: turn.interviewerId, attempt: turn.attempts.length, result: last.result },
              coach: offerMessage(last.result.reaction),
            })
          } else if (turn) {
            set({ turn, stage: 'answering', coach: turn.hint ? { kind: 'hint', text: turn.hint } : null })
          }
          else void get().beginInterview()
        }
      } catch {
        syncUrl(null)
      }
      set({ booted: true })
    },

    async startDemo() {
      sfx.unlock()
      set({ busy: "Reading Maya's resume…", error: null })
      try {
        const form = new FormData()
        form.append('mode', 'demo')
        const { session } = await api.createSession(form)
        set({ session, screen: 'audit', busy: null, ...interviewStart, recordings: {} })
        syncUrl(session.id)
        void get().buildPanel()
      } catch (err) {
        fail(err)
      }
    },

    async startLive(form) {
      sfx.unlock()
      form.append('mode', 'live')
      set({ busy: 'Reading your resume…', error: null })
      try {
        const { session } = await api.createSession(form)
        set({ session, screen: 'audit', busy: null, ...interviewStart, recordings: {} })
        syncUrl(session.id)
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

    go(screen) {
      if (screen !== 'interview') voice.stop()
      set({ screen })
    },

    async beginInterview() {
      const s = get().session
      if (!s) return
      sfx.unlock()
      set({ screen: 'interview', ...interviewStart, coach: { kind: 'welcome', text: welcomeText(s) } })
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
      set({ stage: 'hinting', coach: { kind: 'thinking', text: 'Sam is thinking about how to help…' } })
      try {
        const res = await api.lifeline(session.id, turn.id)
        const updated = res.session.turns.find(t => t.id === turn.id) ?? turn
        set({ session: res.session, turn: updated, beat: null, stage: 'answering', coach: { kind: 'hint', title: res.encouragement, text: res.hint } })
        sfx.pop()
        void voice.speak(`${res.encouragement} ${res.hint}`, COACH.voice)
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
        set({ session, screen: 'huddle', busy: null })
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
        set({ session, screen: 'assemble', busy: null, ...interviewStart })
        syncUrl(session.id)
      } catch (err) {
        fail(err)
      }
    },

    reset() {
      voice.stop()
      syncUrl(null)
      set({ session: null, screen: 'home', ...interviewStart, error: null, busy: null })
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
    text: 'Want a hint and a second try? You get one Lifeline per interview. I give hints, never answers.',
  }
}

function welcomeText(s: SessionDoc) {
  return s.kind === 'rematch'
    ? `Rematch time. ${s.panel[0]?.name.split(' ')[0]} still has doubts. Show what you've practiced.`
    : "I'm Sam, your coach. Take a breath, think out loud, and use real examples from your own work. I'm here if you get stuck."
}
