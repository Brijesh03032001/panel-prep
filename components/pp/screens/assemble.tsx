"use client"

import { ArrowRightIcon, EyeIcon, LifebuoyIcon, MicrophoneIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { domainLabel } from '@/lib/catalog'
import { sfx } from '@/lib/sfx'
import { usePanel } from '@/lib/store'
import { voice } from '@/lib/voice'
import { DomainIcon, Kicker } from '../primitives'
import { NamePlate, RoomBackdrop, SeatFigure, usePreloadSeats, useStageGeometry } from '../stage'
import { TopBar } from '../top-bar'

const VIGNETTE = 'radial-gradient(ellipse at 50% 35%, transparent 20%, rgba(11,14,31,0.75) 75%)'

export function AssembleScreen() {
  const { session } = usePanel()
  const beginInterview = usePanel(s => s.beginInterview)
  const stageRef = useRef<HTMLDivElement>(null)
  const geo = useStageGeometry(stageRef)
  const [shown, setShown] = useState(0)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const skipped = useRef(false)
  usePreloadSeats()

  const panel = session?.panel ?? []

  useEffect(() => {
    if (!panel.length) return
    let cancelled = false
    const intro = (p: (typeof panel)[number]) => `I'm ${p.name.split(' ')[0]}, ${p.title}. ${p.joinReason}`
    panel.forEach(p => voice.prefetch(intro(p), p.voice))
    ;(async () => {
      await new Promise(r => setTimeout(r, 500))
      for (let i = 0; i < panel.length; i++) {
        if (cancelled || skipped.current) return
        setShown(i + 1)
        sfx.reveal()
        const p = panel[i]
        setSpeakingId(p.id)
        await Promise.all([
          voice.speak(intro(p), p.voice),
          new Promise(r => setTimeout(r, 1500)),
        ])
        setSpeakingId(null)
      }
    })()
    return () => {
      cancelled = true
      voice.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id])

  if (!session) return null
  const allShown = shown >= panel.length

  const skip = () => {
    skipped.current = true
    voice.stop()
    setSpeakingId(null)
    setShown(panel.length)
  }

  return (
    <motion.div className="fixed inset-0 overflow-clip bg-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div ref={stageRef} className="absolute inset-0">
        <RoomBackdrop dim={allShown ? 0.15 : 0.45} vignette={VIGNETTE} />
        {geo && (
          <>
            {panel.map((p, i) => (
              <SeatFigure key={p.id} geo={geo} interviewer={p} active={speakingId === p.id} dimmed={false} speaking={speakingId === p.id} visible={i < shown} />
            ))}
            <RoomBackdrop front={geo} dim={allShown ? 0.15 : 0.45} vignette={VIGNETTE} />
            {panel.map((p, i) => {
              const cardW = Math.min(geo.imgW * 0.245, 330)
              return (
                <div key={p.id}>
                  <NamePlate geo={geo} interviewer={p} active={speakingId === p.id} visible={i < shown} />
                  <AnimatePresence>
                    {i < shown && (
                      <motion.div
                        className="absolute z-30"
                        style={{ left: geo.seatX(p.seat) - cardW / 2, width: cardW, bottom: geo.h - geo.figureTop(p.seat) + 14 }}
                        initial={{ opacity: 0, y: 14, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.25 }}
                      >
                        <div className="glass rounded-2xl p-4" style={{ boxShadow: speakingId === p.id ? `0 0 0 1px ${p.color}80, 0 20px 50px -20px ${p.color}` : undefined }}>
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: `${p.color}22`, color: p.color }}>
                            <DomainIcon domain={p.domain} className="h-3.5 w-3.5" />
                            {domainLabel(p.domain)}
                          </span>
                          <p className="mt-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-faint">Joining because</p>
                          <p className="mt-1 text-[14px] leading-snug text-ink">{p.joinReason}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </>
        )}
      </div>

      <div className="absolute inset-x-0 top-0 z-40 bg-gradient-to-b from-[#0b0e1f]/85 to-transparent">
        <TopBar showProgress={false} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-72 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(11,14,31,0.9),transparent)]" />
      <div className="absolute inset-x-0 top-[60px] z-30 text-center">
        <Kicker className="text-gold">
          {session.kind === 'rematch'
            ? 'The Comeback · only the doubts still open'
            : `Your panel · chosen from your resume's gaps for ${session.setup.roleTitle}`}
        </Kicker>
        <h1 className="font-display mt-2 text-[clamp(24px,2.4vw,34px)] font-semibold [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]">
          {session.kind === 'rematch' ? `Rematch with ${panel[0]?.name.split(' ')[0]}` : 'Meet the people who will question you'}
        </h1>
      </div>

      <div className="absolute inset-x-0 bottom-6 z-40 flex flex-col items-center gap-4">
        <AnimatePresence mode="wait">
          {allShown ? (
            <motion.div key="go" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4">
              <div className="glass-soft flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl px-5 py-2.5 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MicrophoneIcon weight="duotone" className="h-3.5 w-3.5 text-ink" /> Speak or type your answers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LifebuoyIcon weight="duotone" className="h-3.5 w-3.5 text-gold" /> One Lifeline: a hint, never the answer
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <EyeIcon weight="duotone" className="h-3.5 w-3.5 text-ink" /> Click anyone to peek behind the panel
                </span>
              </div>
              <button type="button" onClick={() => void beginInterview()} className="gold-btn inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-[15px] font-semibold">
                Start the interview <ArrowRightIcon weight="bold" className="h-4.5 w-4.5" />
              </button>
            </motion.div>
          ) : (
            <motion.button key="skip" type="button" onClick={skip} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-full px-4 py-2 text-sm text-ink-muted ring-1 ring-white/15 transition hover:text-ink">
              Skip introductions
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
