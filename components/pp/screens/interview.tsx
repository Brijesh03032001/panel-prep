"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { usePanel } from '@/lib/store'
import { voice } from '@/lib/voice'
import { AnswerDock } from '../answer-dock'
import { SpeechBubble } from '../bubble'
import { CoachCard } from '../coach'
import { PeekPanel } from '../peek'
import { ResumeMap } from '../resume-map'
import { NamePlate, RoomBackdrop, SeatFigure, usePreloadSeats, useStageGeometry } from '../stage'
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
  const { session, turn, stage, beat, coach, prefs, peekId } = usePanel()
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
            {coach && (
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
        <TopBar />
      </div>

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
