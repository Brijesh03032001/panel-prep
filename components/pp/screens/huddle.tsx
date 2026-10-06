"use client"

import { ArrowRightIcon, CaretDownIcon, ChatsCircleIcon, FastForwardIcon, SealCheckIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { sfx } from '@/lib/sfx'
import { usePanel } from '@/lib/store'
import type { Interviewer } from '@/lib/types'
import { voice } from '@/lib/voice'
import { Avatar, Kicker, deep } from '../primitives'
import { NamePlate, RoomBackdrop, SeatFigure, usePreloadSeats, useStageGeometry, type StageGeometry } from '../stage'
import { TopBar } from '../top-bar'

const VIGNETTE = 'radial-gradient(ellipse at 50% 42%, transparent 22%, rgba(11,14,31,0.8) 78%)'

export function HuddleScreen() {
  const { session } = usePanel()
  const go = usePanel(s => s.go)
  const stageRef = useRef<HTMLDivElement>(null)
  const geo = useStageGeometry(stageRef)
  const [index, setIndex] = useState(-1)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [readOpen, setReadOpen] = useState(false)
  const skipped = useRef(false)
  usePreloadSeats()

  const lines = session?.outcome?.huddle ?? []

  useEffect(() => {
    if (!lines.length) {
      setDone(true)
      return
    }
    let cancelled = false
    lines.forEach(l => voice.prefetch(l.line, session!.panel.find(p => p.id === l.interviewerId)?.voice ?? 'alloy'))
    ;(async () => {
      await new Promise(r => setTimeout(r, 1100))
      for (let i = 0; i < lines.length; i++) {
        if (cancelled || skipped.current) return
        const who = session!.panel.find(p => p.id === lines[i].interviewerId)
        setIndex(i)
        setProgress(0)
        await voice.speak(lines[i].line, who?.voice ?? 'alloy', f => !cancelled && setProgress(f))
        if (cancelled || skipped.current) return
        setProgress(1)
        await new Promise(r => setTimeout(r, 450))
      }
      if (!cancelled) {
        setIndex(-1)
        setDone(true)
        sfx.reveal()
      }
    })()
    return () => {
      cancelled = true
      voice.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id])

  if (!session) return null
  const line = index >= 0 ? lines[index] : null
  const speaker = line ? session.panel.find(p => p.id === line.interviewerId) ?? null : null
  const panel = session.panel

  const skip = () => {
    skipped.current = true
    voice.stop()
    setIndex(-1)
    setDone(true)
  }

  return (
    <motion.div className="fixed inset-0 overflow-clip bg-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div ref={stageRef} className="absolute inset-0">
        <RoomBackdrop dim={done ? 0.12 : 0.38} vignette={VIGNETTE} />
        {geo && (
          <>
            {panel.map(p => {
              const lean = speaker && speaker.id !== p.id ? Math.sign(geo.seatX(speaker.seat) - geo.seatX(p.seat)) * 1.6 : 0
              return (
                <SeatFigure
                  key={p.id}
                  geo={geo}
                  interviewer={p}
                  active={speaker?.id === p.id}
                  dimmed={Boolean(speaker) && speaker?.id !== p.id}
                  speaking={speaker?.id === p.id}
                  tilt={lean}
                />
              )
            })}
            <RoomBackdrop front={geo} dim={done ? 0.12 : 0.38} vignette={VIGNETTE} />
            {panel.map(p => (
              <NamePlate key={p.id} geo={geo} interviewer={p} active={speaker?.id === p.id} compact />
            ))}
            <AnimatePresence mode="wait">
              {speaker && line && <HuddleBubble key={index} geo={geo} who={speaker} text={line.line} progress={progress} />}
            </AnimatePresence>
          </>
        )}
      </div>

      <div className="absolute inset-x-0 top-0 z-40 bg-gradient-to-b from-[#0b0e1f]/85 to-transparent">
        <TopBar showProgress={false} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[66px] z-30 text-center">
        <Kicker className="text-gold">{done ? 'Panel huddle · complete' : 'Panel huddle · behind closed doors'}</Kicker>
        <AnimatePresence mode="wait">
          <motion.h1
            key={done ? 'done' : 'conferring'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="font-display mt-2 flex items-center justify-center gap-3 text-[clamp(24px,2.4vw,34px)] font-semibold [text-shadow:0_2px_20px_rgba(0,0,0,0.6)]"
          >
            {done ? 'They have reached a verdict.' : 'The panel is comparing notes'}
            {!done && (
              <span className="inline-flex gap-1.5">
                {session.panel.map((p, i) => (
                  <motion.span key={p.id} className="h-2 w-2 rounded-full" style={{ background: p.color }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </span>
            )}
          </motion.h1>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 left-1/2 z-40 w-[min(620px,calc(100%-32px))] -translate-x-1/2">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="glass mx-auto flex w-fit items-center gap-4 rounded-full py-2 pl-3 pr-2"
            >
              <div className="flex items-center gap-1.5" aria-label={`Line ${Math.max(1, index + 1)} of ${lines.length}`}>
                {lines.map((l, i) => {
                  const who = session.panel.find(p => p.id === l.interviewerId)
                  return (
                    <span key={i} className="relative h-1.5 w-7 overflow-hidden rounded-full bg-white/12">
                      <motion.span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ background: who?.color ?? '#fff' }}
                        initial={false}
                        animate={{ width: i < index ? '100%' : i === index ? `${Math.round(progress * 100)}%` : '0%' }}
                        transition={{ duration: 0.2 }}
                      />
                    </span>
                  )
                })}
              </div>
              <p className="min-w-[150px] text-sm text-ink-muted">
                {speaker ? (
                  <>
                    <span className="font-semibold" style={{ color: speaker.color }}>
                      {speaker.name.split(' ')[0]}
                    </span>{' '}
                    is speaking
                  </>
                ) : (
                  'Gathering their thoughts…'
                )}
              </p>
              <button type="button" onClick={skip} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm text-ink-muted ring-1 ring-white/15 transition hover:text-ink hover:ring-white/30">
                <FastForwardIcon weight="duotone" className="h-4 w-4" /> Skip
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className="glass overflow-hidden rounded-[26px]"
            >
              <AnimatePresence initial={false}>
                {readOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-b border-line">
                    <div className="scrollbar-thin max-h-[34vh] space-y-3.5 overflow-y-auto p-5">
                      {lines.map((l, i) => {
                        const who = session.panel.find(p => p.id === l.interviewerId)!
                        return (
                          <div key={i} className="flex items-start gap-3">
                            <Avatar seat={who.seat} size={30} ring={who.color} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold" style={{ color: who.color }}>
                                {who.name.split(' ')[0]} <span className="font-normal text-ink-faint">· {who.title}</span>
                              </p>
                              <p className="mt-0.5 text-[14px] leading-snug text-ink">{l.line}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-center gap-4 p-4 pl-5">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                  <motion.span className="absolute inset-0 rounded-2xl bg-gold/25" animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.35, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
                  <SealCheckIcon weight="duotone" className="relative h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[17px] font-semibold leading-tight">Your verdict is sealed</p>
                  {lines.length > 0 ? (
                    <button type="button" onClick={() => setReadOpen(!readOpen)} className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-ink-muted transition hover:text-ink" aria-expanded={readOpen}>
                      <ChatsCircleIcon weight="duotone" className="h-4 w-4" />
                      {readOpen ? 'Hide what they said' : `Read what they said (${lines.length})`}
                      <CaretDownIcon className={`h-3.5 w-3.5 transition ${readOpen ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <p className="mt-1 text-[13px] text-ink-muted">It comes from their final confidence.</p>
                  )}
                </div>
                <button type="button" onClick={() => go('verdict')} className="gold-btn inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold">
                  Reveal the verdict <ArrowRightIcon weight="bold" className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function HuddleBubble({ geo, who, text, progress }: { geo: StageGeometry; who: Interviewer; text: string; progress: number }) {
  const width = Math.min(440, geo.w - 32)
  const x = geo.seatX(who.seat)
  const left = Math.max(16, Math.min(geo.w - width - 16, x - width / 2))
  const arrow = Math.max(28, Math.min(width - 28, x - left))
  const box = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const top = Math.max(150, geo.figureTop(who.seat) - 12 - height)
  const words = text.split(/\s+/)
  const shown = Math.ceil(progress * words.length)
  return (
    <motion.div
      ref={box}
      className="absolute z-30"
      style={{ left, width, top, visibility: height ? 'visible' : 'hidden' }}
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      <div className="relative rounded-[20px] bg-[#fbfbfd] px-5 pb-4 pt-3.5 text-[#121528] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)]">
        <div className="absolute inset-y-4 left-0 w-1 rounded-r-full" style={{ background: who.color }} />
        <p className="text-[12px] font-semibold" style={{ color: deep(who.color) }}>
          {who.name.split(' ')[0]} <span className="font-normal text-[#5b6180]">· to the panel</span>
        </p>
        <p className="font-display mt-1 text-[clamp(15px,1.15vw,18px)] font-medium leading-snug" aria-live="polite">
          {words.map((w, i) => (
            <span key={i} className="transition-opacity duration-200" style={{ opacity: i < shown ? 1 : 0.2 }}>
              {w}{' '}
            </span>
          ))}
        </p>
        <span className="absolute -bottom-[9px] h-5 w-5 rotate-45 rounded-[3px] bg-[#fbfbfd]" style={{ left: arrow - 10 }} aria-hidden />
      </div>
    </motion.div>
  )
}
