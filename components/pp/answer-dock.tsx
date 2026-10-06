"use client"

import { ArrowRightIcon, CircleNotchIcon, LifebuoyIcon, MicrophoneIcon, PaperPlaneRightIcon, PlayIcon, SkipForwardIcon, StopIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useRecorder } from '@/hooks/use-recorder'
import { demoAnswer, DEMO_STUDENT } from '@/lib/demo'
import { usePanel } from '@/lib/store'
import { voice } from '@/lib/voice'
import { cx } from './primitives'
import { Waveform } from './waveform'

const AUTO_ADVANCE_MS = 6000

export function AnswerDock() {
  const { session, turn, stage, queued, ended, config, prefs, peekId } = usePanel()
  const submit = usePanel(s => s.submit)
  const takeLifeline = usePanel(s => s.takeLifeline)
  const moveOn = usePanel(s => s.moveOn)
  const advance = usePanel(s => s.advance)
  const wrapUp = usePanel(s => s.wrapUp)
  const rec = useRecorder(Boolean(config?.stt))
  const [text, setText] = useState('')
  const [demoPlaying, setDemoPlaying] = useState(false)
  const audioUrl = useRef<string | null>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const demoTimer = useRef<number | null>(null)

  const interviewer = session?.panel.find(p => p.id === turn?.interviewerId)
  const isDemo = session?.mode === 'demo'
  const scripted = isDemo && session && turn ? demoAnswer(session, turn) : null
  const lifelineLeft = session ? !session.lifeline.used : false
  const canType = stage === 'answering' && rec.state === 'idle' && !demoPlaying
  const recording = rec.state === 'recording'

  useEffect(() => {
    setText('')
    audioUrl.current = null
  }, [turn?.id, turn?.attempts.length])

  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [text, rec.interim])

  useEffect(() => () => {
    if (demoTimer.current) window.clearInterval(demoTimer.current)
  }, [])

  const send = () => {
    const answer = text.trim()
    if (!answer || stage !== 'answering') return
    void submit(answer, audioUrl.current)
  }

  const toggleMic = async () => {
    if (recording) {
      const { text: spoken, audioUrl: url } = await rec.stop()
      audioUrl.current = url
      if (spoken) setText(prev => `${prev} ${spoken}`.trim())
      requestAnimationFrame(() => area.current?.focus())
    } else {
      voice.stop()
      await rec.start()
    }
  }

  const playDemo = () => {
    if (!scripted || demoPlaying) return
    setDemoPlaying(true)
    setText('')
    const words = scripted.split(' ')
    let i = 0
    demoTimer.current = window.setInterval(() => {
      i++
      setText(words.slice(0, i).join(' '))
      if (i >= words.length) {
        window.clearInterval(demoTimer.current!)
        demoTimer.current = null
        setDemoPlaying(false)
      }
    }, 85)
  }

  const waitingForNext = stage === 'feedback' && !queued && !ended

  return (
    <div className="glass rounded-[22px] p-3">
      <AnimatePresence mode="wait" initial={false}>
        {stage === 'decision' ? (
          <Row key="decision">
            <p className="flex-1 px-2 text-sm text-ink-muted">
              {lifelineLeft ? 'That answer left a doubt. Take a hint and try again, or keep going.' : 'Keep going. You can come back to this in a rematch.'}
            </p>
            <button type="button" onClick={() => void moveOn()} className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-muted ring-1 ring-white/15 transition hover:text-ink hover:ring-white/30">
              Move on
            </button>
            {lifelineLeft && (
              <button type="button" onClick={() => void takeLifeline()} className="gold-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
                <LifebuoyIcon weight="duotone" className="h-4 w-4" /> Use Lifeline
              </button>
            )}
          </Row>
        ) : stage === 'feedback' && (queued || ended) ? (
          <Row key="continue">
            <AdvanceTimer paused={Boolean(peekId) || !prefs.autoAdvance} onDone={advance} keyId={(queued?.id ?? 'end') + String(ended)} />
            <p className="flex-1 text-sm text-ink-muted">
              {ended ? (
                <>The panel has heard enough. Time to deliberate.</>
              ) : (
                <>
                  Up next:{' '}
                  <span className="font-semibold" style={{ color: session?.panel.find(p => p.id === queued!.interviewerId)?.color }}>
                    {session?.panel.find(p => p.id === queued!.interviewerId)?.name}
                  </span>
                  {queued!.kind === 'follow-up' ? ' with a follow-up' : ''}
                </>
              )}
            </p>
            <button type="button" onClick={ended ? () => void wrapUp() : advance} className="gold-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              {ended ? 'Hear the verdict' : 'Next question'} <ArrowRightIcon weight="bold" className="h-4 w-4" />
            </button>
          </Row>
        ) : (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-end gap-2.5">
              <button
                type="button"
                onClick={() => void toggleMic()}
                disabled={!(stage === 'answering' && !demoPlaying) || rec.state === 'transcribing' || !rec.supported}
                aria-label={recording ? 'Stop recording' : 'Answer by voice'}
                className={cx(
                  'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition',
                  recording ? 'bg-[#F87171] text-white' : 'bg-white/8 text-ink ring-1 ring-white/15 hover:bg-white/12 disabled:opacity-35',
                )}
              >
                {recording && <span className="ripple absolute inset-0 rounded-2xl text-[#F87171]" />}
                {rec.state === 'transcribing' ? <CircleNotchIcon weight="bold" className="h-5 w-5 animate-spin" /> : recording ? <StopIcon weight="fill" className="h-4.5 w-4.5 fill-current" /> : <MicrophoneIcon weight="duotone" className="h-5 w-5" />}
              </button>

              <div className="relative min-w-0 flex-1">
                {(recording || demoPlaying) && (
                  <div className="pointer-events-none absolute inset-x-3 top-1.5">
                    <Waveform analyser={rec.analyser} active color={demoPlaying ? '#FFC627' : '#F87171'} height={14} bars={48} />
                  </div>
                )}
                <textarea
                  ref={area}
                  rows={1}
                  value={recording && rec.interim ? `${text} ${rec.interim}`.trim() : text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  readOnly={!canType}
                  placeholder={placeholder(stage, interviewer?.name.split(' ')[0], recording, rec.state === 'transcribing', isDemo)}
                  className={cx(
                    'scrollbar-thin block w-full resize-none rounded-2xl bg-black/30 px-4 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint ring-1 ring-white/10 transition focus:outline-none focus:ring-gold/50',
                    recording || demoPlaying ? 'pb-3 pt-6' : 'py-[15px]',
                  )}
                />
              </div>

              {stage === 'asking' ? (
                <button type="button" onClick={() => voice.stop()} className="flex h-14 shrink-0 items-center gap-1.5 rounded-2xl px-4 text-sm text-ink-muted ring-1 ring-white/15 transition hover:text-ink">
                  <SkipForwardIcon weight="duotone" className="h-4 w-4" /> Skip
                </button>
              ) : (
                <button
                  type="button"
                  onClick={send}
                  disabled={!canType || !text.trim()}
                  aria-label="Send answer"
                  className="gold-btn flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                >
                  {stage === 'evaluating' || stage === 'hinting' ? <CircleNotchIcon weight="bold" className="h-5 w-5 animate-spin" /> : <PaperPlaneRightIcon weight="duotone" className="h-5 w-5" />}
                </button>
              )}
            </div>

            <div className="mt-2.5 flex items-center gap-2 px-1">
              {scripted && stage === 'answering' && (
                <button
                  type="button"
                  onClick={playDemo}
                  disabled={demoPlaying}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold/12 px-3 py-1 text-xs font-medium text-gold ring-1 ring-gold/30 transition hover:bg-gold/20 disabled:opacity-60"
                >
                  <PlayIcon weight="fill" className="h-3 w-3 fill-current" /> {demoPlaying ? `${DEMO_STUDENT} is answering…` : `Play ${DEMO_STUDENT}'s ${turn && turn.attempts.length > 0 ? 'second try' : 'answer'}`}
                </button>
              )}
              <p className="text-[11px] text-ink-faint">
                {rec.error ?? (waitingForNext ? 'Preparing the next question…' : statusLine(stage, Boolean(config?.stt)))}
              </p>
              <button
                type="button"
                onClick={() => void takeLifeline()}
                disabled={!lifelineLeft || stage !== 'answering' || demoPlaying || recording}
                className={cx(
                  'ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition',
                  lifelineLeft ? 'text-gold ring-1 ring-gold/35 hover:bg-gold/10 disabled:opacity-40' : 'text-ink-faint ring-1 ring-white/10',
                )}
                title="One hint per interview. Hints, never answers."
              >
                <LifebuoyIcon weight="duotone" className="h-3.5 w-3.5" />
                {lifelineLeft ? 'Lifeline · 1 left' : 'Lifeline used'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex min-h-14 items-center gap-3 px-1">
      {children}
    </motion.div>
  )
}

function AdvanceTimer({ paused, onDone, keyId }: { paused: boolean; onDone: () => void; keyId: string }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => setElapsed(0), [keyId])
  useEffect(() => {
    if (paused) return
    const start = performance.now() - elapsed
    let raf = 0
    const tick = () => {
      const e = performance.now() - start
      setElapsed(e)
      if (e >= AUTO_ADVANCE_MS) onDone()
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, keyId])
  const r = 13
  const c = 2 * Math.PI * r
  return (
    <svg width="34" height="34" className="-rotate-90 shrink-0" aria-hidden>
      <circle cx="17" cy="17" r={r} stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
      <circle cx="17" cy="17" r={r} stroke="#FFC627" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, elapsed / AUTO_ADVANCE_MS))} />
    </svg>
  )
}

function placeholder(stage: string, name: string | undefined, recording: boolean, transcribing: boolean, demo: boolean) {
  if (recording) return 'Listening…'
  if (transcribing) return 'Turning your answer into text…'
  if (stage === 'asking') return `${name ?? 'The interviewer'} is asking…`
  if (stage === 'evaluating') return 'The panel is weighing your answer…'
  if (stage === 'hinting') return 'Sam is preparing a hint…'
  if (stage === 'answering') return demo ? 'Type an answer, or play the scripted one below' : 'Speak or type your answer. Enter to send.'
  return ''
}

function statusLine(stage: string, serverSTT: boolean) {
  if (stage === 'answering') return serverSTT ? 'Voice is transcribed by ASU CreateAI. Think out loud and use real examples.' : 'Think out loud and use real examples from your own work.'
  if (stage === 'evaluating') return 'Checking your answer against what this interviewer was looking for…'
  return ''
}
