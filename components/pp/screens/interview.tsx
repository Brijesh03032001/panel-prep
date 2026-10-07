"use client"

import { DoorOpenIcon, FlagCheckeredIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { usePanel } from '@/lib/store'
import { voice } from '@/lib/voice'
import { AnswerDock } from '../answer-dock'
import { SpeechBubble } from '../bubble'
import { CoachCard } from '../coach'
import { PeekPanel } from '../peek'
import { ResumeMap } from '../resume-map'
import { NamePlate, RoomBackdrop, SeatFigure, usePreloadSeats, useStageGeometry, type FigureStatus } from '../stage'
import { TopBar } from '../top-bar'

export function useMapWidth() {
  const [w, setW] = useState(380)
  useEffect(() => {
    const f = () => setW(window.innerWidth >= 1680 ? 420 : window.innerWidth >= 1280 ? 370 : 330)
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return w
}

export function InterviewScreen() {
  const { session, turn, stage, beat, coach, prefs, peekId, leaving } = usePanel()
  const doneAsking = usePanel(s => s.doneAsking)
  const setPeek = usePanel(s => s.setPeek)
  const dismissCoach = usePanel(s => s.dismissCoach)
  const stageRef = useRef<HTMLDivElement>(null)
  const geo = useStageGeometry(stageRef)
  const mapW = useMapWidth()
  const [progress, setProgress] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  usePreloadSeats()

  const interviewer = session?.panel.find(p => p.id === turn?.interviewerId) ?? null
  const askKey = stage === 'asking' && turn ? turn.id : null

  useEffect(() => {
    if (!askKey || !turn || !interviewer) return
    let cancelled = false
    setProgress(0)
    setSpeaking(true)
    void voice.speak(turn.question, interviewer.voice, f => !cancelled && setProgress(f)).then(() => {
      if (cancelled) return
      setSpeaking(false)
      setProgress(1)
      doneAsking()
    })
    return () => {
      cancelled = true
      setSpeaking(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askKey])

  useEffect(() => {
    if (stage !== 'asking') setProgress(1)
  }, [stage])

  if (!session) return null
  const showAside = prefs.map || Boolean(peekId)
  const concern = interviewer?.concerns.find(c => c.id === turn?.concernId)
  const testing = stage === 'asking' || stage === 'answering' || stage === 'evaluating' || stage === 'hinting'
  const activeLines = testing && concern ? concern.lineIds : []

  return (
    <motion.div className="fixed inset-0 overflow-clip bg-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 scale-110">
        <RoomBackdrop dim={0.55} blur />
      </div>

      <div
        ref={stageRef}
        className="absolute inset-y-0 left-0 overflow-clip transition-[right] duration-500"
        style={{ right: showAside ? mapW + 28 : 0, borderRadius: showAside ? '0 28px 28px 0' : 0 }}
      >
        {/* The camera: eases toward whoever has the floor, and leans in a little more while they speak. */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={
            geo && interviewer
              ? {
                  scale: stage === 'asking' ? 1.04 : 1.018,
                  originX: geo.seatX(interviewer.seat) / geo.w,
                  originY: (geo.figureTop(interviewer.seat) + geo.figureW(interviewer.seat) * 0.5) / geo.h,
                }
              : { scale: 1, originX: 0.5, originY: 0.5 }
          }
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <RoomBackdrop />
          {geo && (
            <>
              {session.panel.map(p => (
                <SeatFigure
                  key={p.id}
                  geo={geo}
                  interviewer={p}
                  active={p.id === interviewer?.id}
                  dimmed={Boolean(interviewer) && p.id !== interviewer?.id}
                  speaking={speaking && p.id === interviewer?.id}
                  status={p.id !== interviewer?.id ? null : statusFor(stage, speaking)}
                  onClick={() => setPeek(p.id)}
                />
              ))}
              <RoomBackdrop front={geo} />
              {session.panel.map(p => (
                <NamePlate
                  key={p.id}
                  geo={geo}
                  interviewer={p}
                  active={p.id === interviewer?.id}
                  delta={beat?.interviewerId === p.id ? beat.result.scoreDelta : null}
                  deltaKey={beat?.id}
                  onClick={() => setPeek(p.id)}
                />
              ))}
            </>
          )}
        </motion.div>
        {geo && (
          <>
            <AnimatePresence mode="wait">
              {turn && interviewer && (
                <SpeechBubble
                  key={turn.id}
                  geo={geo}
                  session={session}
                  interviewer={interviewer}
                  turn={turn}
                  progress={progress}
                  beat={beat}
                  retrying={turn.attempts.length > 0}
                  onPeek={() => setPeek(interviewer.id)}
                />
              )}
            </AnimatePresence>
            {!turn && (
              <div className="absolute inset-x-0 top-[30%] flex justify-center">
                <span className="glass-soft rounded-full px-4 py-2 text-sm text-ink-muted">The panel is getting ready…</span>
              </div>
            )}
          </>
        )}

        {/* Wide stages put Sam beside the dock so the card never covers a name plate. */}
        {geo && (
          <div className={`absolute inset-x-4 bottom-4 z-30 flex justify-center gap-3 ${geo.w >= 1000 ? 'flex-row items-end' : 'flex-col items-center'}`}>
            {coach && !coach.coaching && (
              <div className={geo.w >= 1000 ? 'w-[350px] shrink-0' : 'w-full max-w-[860px]'}>
                <CoachCard coach={coach} onDismiss={dismissCoach} />
              </div>
            )}
            <div className="w-full min-w-0 max-w-[860px] flex-1">
              <AnswerDock />
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 top-0 z-40 bg-gradient-to-b from-[#0b0e1f]/80 to-transparent">
        <TopBar backLabel="Leave" />
      </div>

      <AnimatePresence>{leaving && <LeaveDialog />}</AnimatePresence>

      <AnimatePresence>
        {showAside && (
          <motion.aside
            className="absolute bottom-4 top-[72px] z-30"
            style={{ right: 16, width: mapW }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          >
            <div className="glass flex h-full flex-col overflow-hidden rounded-[22px]">
              <ResumeMap
                lines={session.resume.lines}
                panel={session.panel}
                activeLineIds={activeLines}
                activeColor={interviewer?.color}
                activeName={interviewer?.name.split(' ')[0]}
                className="h-full"
              />
            </div>
            <PeekPanel session={session} interviewerId={peekId} onClose={() => setPeek(null)} />
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Leaving mid-interview never loses anything: the session is saved and the open question waits.
function LeaveDialog() {
  const { session } = usePanel()
  const confirmLeave = usePanel(s => s.confirmLeave)
  const cancelLeave = usePanel(s => s.cancelLeave)
  const wrapUp = usePanel(s => s.wrapUp)
  const answered = session?.turns.filter(t => t.attempts.length > 0).length ?? 0
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-stage/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-title"
      onKeyDown={e => e.key === 'Escape' && cancelLeave()}
    >
      <motion.div className="glass w-full max-w-[440px] rounded-[24px] p-6" initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 6 }}>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15 text-gold">
          <DoorOpenIcon weight="duotone" className="h-6 w-6" />
        </span>
        <h2 id="leave-title" className="font-display mt-4 text-xl font-semibold">
          Leave the interview?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Your answers so far are saved. Come back anytime and pick up at the same question, or end now and see your results for what you&apos;ve answered.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={cancelLeave} autoFocus className="gold-btn rounded-xl px-4 py-3 text-sm font-semibold">
            Keep interviewing
          </button>
          {answered > 0 && (
            <button
              type="button"
              onClick={() => {
                cancelLeave()
                void wrapUp()
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gold ring-1 ring-gold/35 transition hover:bg-gold/10"
            >
              <FlagCheckeredIcon weight="duotone" className="h-4 w-4" /> End interview &amp; see my results
            </button>
          )}
          <button type="button" onClick={confirmLeave} className="rounded-xl px-4 py-3 text-sm text-ink-muted ring-1 ring-white/15 transition hover:text-ink hover:ring-white/30">
            Leave for now
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// What the interviewer with the floor is doing, shown above their head: talking, listening to the answer, or weighing it.
function statusFor(stage: string, speaking: boolean): FigureStatus {
  if (stage === 'asking') return speaking ? 'speaking' : null
  if (stage === 'answering') return 'listening'
  if (stage === 'evaluating') return 'thinking'
  return null
}
