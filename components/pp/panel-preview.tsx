"use client"

import { MicrophoneIcon, ShootingStarIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LINE_STATUS, SEATS, VERDICTS } from '@/lib/catalog'
import type { Interviewer, LineStatus, Reaction, Seat } from '@/lib/types'
import { AnimatedNumber, ReactionChip, ScoreRing, StatusIcon, deep } from './primitives'
import { RoomBackdrop, SeatFigure, stageGeometry, type StageGeometry } from './stage'

// A scripted, silent loop of Maya's real demo moments: it shows the product in the first five seconds.
function person(id: string, seat: Seat, name: string, title: string, domain: string, start: number): Interviewer {
  return {
    id,
    seat,
    name,
    title,
    domain,
    color: SEATS[seat].color,
    voice: SEATS[seat].voice,
    joinReason: '',
    lookingFor: '',
    persona: '',
    startConfidence: start,
    confidence: start,
    confidenceHistory: [start],
    reaction: 'neutral',
    concerns: [],
    questionsAsked: 0,
  }
}

const PANEL = [
  person('priya', 0, 'Priya Raman', 'Frontend Lead', 'frontend', 62),
  person('leo', 1, 'Leo Park', 'QA Engineer', 'qa', 42),
  person('marcus', 2, 'Marcus Hale', 'DevOps Engineer', 'devops', 35),
]

const LINES = [
  { id: 'aws', text: 'Deployed the portfolio on AWS' },
  { id: 'jest', text: 'Jest (familiar)' },
  { id: 'ctx', text: 'Managed app state with React Context' },
]

const BEATS: { who: string; q: string; a: string; reaction: Reaction; delta: number; line: string; status: LineStatus }[] = [
  {
    who: 'marcus',
    q: 'Your resume says AWS. Walk me through how your site actually goes live.',
    a: 'I run npm run build, sync the folder to S3, and CloudFront serves it over HTTPS.',
    reaction: 'impressed',
    delta: 16,
    line: 'aws',
    status: 'green',
  },
  {
    who: 'leo',
    q: 'How would you test the StudyBuddy booking form?',
    a: 'Render it, pick a time, click Book, and check the session shows up in the list.',
    reaction: 'probing',
    delta: 4,
    line: 'jest',
    status: 'yellow',
  },
  {
    who: 'priya',
    q: 'Why did you split your React Context in two?',
    a: 'Changing the group re-rendered everything, so I split user and group apart.',
    reaction: 'impressed',
    delta: 12,
    line: 'ctx',
    status: 'green',
  },
]

type Phase = 'idle' | 'ask' | 'answer' | 'react'
const START = Object.fromEntries(PANEL.map(p => [p.id, p.startConfidence])) as Record<string, number>
const START_STATUS: Record<string, LineStatus> = { aws: 'untested', jest: 'untested', ctx: 'untested' }

export function PanelPreview() {
  const frame = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const reduce = useReducedMotion()
  const [beat, setBeat] = useState(-1)
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [conf, setConf] = useState(START)
  const [reactions, setReactions] = useState<Record<string, Reaction>>({})
  const [status, setStatus] = useState(START_STATUS)
  const [deltaKey, setDeltaKey] = useState(0)

  useLayoutEffect(() => {
    const el = frame.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (reduce) {
      setConf({ priya: 74, leo: 46, marcus: 51 })
      setReactions({ priya: 'impressed', leo: 'probing', marcus: 'impressed' })
      setStatus({ aws: 'green', jest: 'yellow', ctx: 'green' })
      return
    }
    let cancelled = false
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
    ;(async () => {
      await wait(1200)
      while (!cancelled) {
        for (let i = 0; i < BEATS.length && !cancelled; i++) {
          const b = BEATS[i]
          setBeat(i)
          setPhase('ask')
          setProgress(0)
          const words = b.q.split(/\s+/).length
          for (let k = 1; k <= words && !cancelled; k++) {
            setProgress(k / words)
            await wait(115)
          }
          await wait(500)
          if (cancelled) return
          setPhase('answer')
          await wait(2600)
          if (cancelled) return
          setPhase('react')
          setConf(c => ({ ...c, [b.who]: c[b.who] + b.delta }))
          setReactions(r => ({ ...r, [b.who]: b.reaction }))
          setStatus(s => ({ ...s, [b.line]: b.status }))
          setDeltaKey(k => k + 1)
          await wait(2600)
        }
        if (cancelled) return
        setBeat(-1)
        setPhase('idle')
        await wait(2400)
        setConf(START)
        setReactions({})
        setStatus(START_STATUS)
        await wait(900)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reduce])

  const geo = size ? stageGeometry(size.w, size.h, { clamp: false }) : null
  const current = beat >= 0 ? BEATS[beat] : null
  const speaker = current ? PANEL.find(p => p.id === current.who)! : null
  const panel = PANEL.map(p => ({ ...p, confidence: conf[p.id], reaction: reactions[p.id] ?? ('neutral' as Reaction) }))
  const overall = Math.round(PANEL.reduce((sum, p) => sum + conf[p.id], 0) / PANEL.length)

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-10 rounded-[60px] bg-[radial-gradient(ellipse_at_30%_20%,rgba(140,29,64,0.45),transparent_60%),radial-gradient(ellipse_at_80%_80%,rgba(255,198,39,0.16),transparent_60%)] blur-2xl" />
      <div
        ref={frame}
        className="relative aspect-[3/2] w-full overflow-hidden rounded-[28px] bg-stage shadow-[0_50px_120px_-40px_rgba(0,0,0,0.95)] ring-1 ring-white/15"
        aria-label="A preview of a Mockify interview: an interviewer asks about a resume line, the student answers, and the panel's confidence updates."
        role="img"
      >
        <RoomBackdrop dim={0.08} />
        {geo && (
          <>
            {panel.map(p => (
              <SeatFigure
                key={p.id}
                geo={geo}
                interviewer={p}
                active={speaker?.id === p.id}
                dimmed={Boolean(speaker) && speaker?.id !== p.id}
                speaking={speaker?.id === p.id && phase === 'ask'}
                status={speaker?.id !== p.id ? null : phase === 'ask' ? 'speaking' : phase === 'answer' ? 'listening' : null}
                synthetic
              />
            ))}
            <RoomBackdrop front={geo} dim={0.08} />
            {panel.map(p => (
              <Plate key={p.id} geo={geo} p={p} active={speaker?.id === p.id} delta={current?.who === p.id && phase === 'react' ? current.delta : null} deltaKey={deltaKey} />
            ))}
            <AnimatePresence>{speaker && current && phase !== 'idle' && <PreviewBubble key={beat} geo={geo} who={speaker} text={current.q} progress={progress} />}</AnimatePresence>
            <AnimatePresence>
              {current && phase === 'answer' && (
                <motion.div
                  key={`a${beat}`}
                  className="absolute left-1/2 z-30 flex w-[min(86%,460px)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#0f1228]/90 px-3 py-2.5 ring-1 ring-white/15 backdrop-blur-md"
                  style={{ top: geo.tableY + geo.imgH * 0.115 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                >
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-[#1a1300]">
                    <span className="ripple absolute inset-0 rounded-full text-gold" />
                    <MicrophoneIcon weight="fill" className="relative h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">You, answering</p>
                    <p className="text-[12.5px] leading-snug text-ink">{current.a}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
        <div className="absolute left-3.5 top-3.5 z-30 flex items-center gap-2 rounded-full bg-[#0b0e1f]/70 px-3 py-1 text-[11px] text-ink-muted ring-1 ring-white/10 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#F87171] opacity-70" />
            <span className="relative h-2 w-2 rounded-full bg-[#F87171]" />
          </span>
          Live mock panel · Frontend internship
        </div>
      </div>

      <div className="relative z-10 -mt-9 grid grid-cols-[1.35fr_1fr] gap-3 px-3 sm:px-8">
        <div className="glass rounded-2xl p-3.5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">Defensibility Map</p>
          <ul className="mt-2 space-y-1.5">
            {LINES.map(l => (
              <li key={l.id} className="flex items-center gap-2 text-[12px]">
                <motion.span key={status[l.id]} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                  <StatusIcon status={status[l.id]} className="h-4 w-4" />
                </motion.span>
                <span className="min-w-0 flex-1 truncate text-ink">{l.text}</span>
                <span className="shrink-0 text-[10.5px] font-medium" style={{ color: LINE_STATUS[status[l.id]].color }}>
                  {status[l.id] === 'green' ? 'Defended' : status[l.id] === 'yellow' ? 'Partly' : status[l.id] === 'red' ? 'Not yet' : 'Untested'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass flex flex-col justify-between rounded-2xl p-3.5">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-faint">Panel confidence</p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <AnimatedNumber value={overall} suffix="%" className="font-display text-[32px] font-semibold leading-none" />
            <span className="mb-0.5 inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: VERDICTS['Rising Star'].color }}>
              <ShootingStarIcon weight="duotone" className="h-3.5 w-3.5" /> Rising Star
            </span>
          </div>
          <div className="mt-2.5 flex h-1.5 gap-[2px]">
            <span className="h-full w-[40%] rounded-full bg-[#A78BFA]/35" />
            <span className="relative h-full w-[30%] rounded-full bg-[#F59E0B]/35">
              <motion.span className="absolute inset-y-0 left-0 rounded-full bg-[#F59E0B]" animate={{ width: `${Math.max(0, Math.min(100, ((overall - 40) / 30) * 100))}%` }} transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
            </span>
            <span className="h-full w-[30%] rounded-full bg-gold/30" />
          </div>
        </div>
      </div>
    </div>
  )
}

function Plate({ geo, p, active, delta, deltaKey }: { geo: StageGeometry; p: Interviewer; active: boolean; delta: number | null; deltaKey: number }) {
  const width = Math.min(geo.imgW * 0.235, 172)
  return (
    <motion.div
      className="glass absolute z-20 flex items-center gap-2 rounded-xl px-2 py-1.5"
      style={{ left: geo.seatX(p.seat) - width / 2, width, top: geo.tableY - geo.imgH * 0.02 }}
      animate={{ scale: active ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <span className="absolute inset-x-2 top-0 h-[2px] rounded-full" style={{ background: p.color, opacity: active ? 1 : 0.5 }} />
      <div className="relative">
        <ScoreRing value={p.confidence} color={p.color} size={36} stroke={3.5} label={`${p.name} confidence`} />
        <AnimatePresence>
          {delta != null && (
            <motion.span
              key={deltaKey}
              className="font-display pointer-events-none absolute -top-1 left-1/2 text-lg font-bold"
              style={{ color: delta > 0 ? '#22C55E' : '#F87171', textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}
              initial={{ opacity: 0, y: 0, x: '-50%', scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -40, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, times: [0, 0.15, 0.7, 1], ease: 'easeOut' }}
            >
              +{delta}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="min-w-0">
        <p className="font-display truncate text-[12px] font-semibold leading-tight" style={{ color: active ? p.color : undefined }}>
          {p.name.split(' ')[0]}
        </p>
        <div className="mt-0.5">
          <ReactionChip reaction={p.reaction} />
        </div>
      </div>
    </motion.div>
  )
}

function PreviewBubble({ geo, who, text, progress }: { geo: StageGeometry; who: Interviewer; text: string; progress: number }) {
  const width = Math.min(geo.w * 0.56, 330)
  const x = geo.seatX(who.seat)
  const left = Math.max(10, Math.min(geo.w - width - 10, x - width / 2))
  const arrow = Math.max(22, Math.min(width - 22, x - left))
  const box = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const top = Math.max(46, geo.figureTop(who.seat) - 6 - height)
  const words = text.split(/\s+/)
  const shown = Math.ceil(progress * words.length)
  return (
    <motion.div
      ref={box}
      className="absolute z-30"
      style={{ left, width, top, visibility: height ? 'visible' : 'hidden' }}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      <div className="relative rounded-2xl bg-[#fbfbfd] px-3.5 pb-2.5 pt-2 text-[#121528] shadow-[0_20px_40px_-14px_rgba(0,0,0,0.7)]">
        <p className="text-[10.5px] font-semibold" style={{ color: deep(who.color) }}>
          {who.name.split(' ')[0]} <span className="font-normal text-[#5b6180]">· {who.title}</span>
        </p>
        <p className="font-display mt-0.5 text-[13.5px] font-medium leading-snug">
          {words.map((w, i) => (
            <span key={i} className="transition-opacity duration-150" style={{ opacity: i < shown ? 1 : 0.2 }}>
              {w}{' '}
            </span>
          ))}
        </p>
        <span className="absolute -bottom-[7px] h-3.5 w-3.5 rotate-45 rounded-[2px] bg-[#fbfbfd]" style={{ left: arrow - 7 }} aria-hidden />
      </div>
    </motion.div>
  )
}
