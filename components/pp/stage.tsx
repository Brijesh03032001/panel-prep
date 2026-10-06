"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import { REACTIONS, SEAT_IMAGES } from '@/lib/catalog'
import type { Interviewer, Seat } from '@/lib/types'
import { AnimatedNumber, ReactionChip, ScoreRing, cx } from './primitives'

// room.png is 3:2. Chair-back centers, chair tops and the table's far edge, measured from the artwork.
const IMG_ASPECT = 1.5
const CHAIR_X: Record<Seat, number> = { 0: 0.235, 1: 0.499, 2: 0.771 }
const TABLE_Y = 0.64
// Figures are sized to the chair backs and tuck behind the table edge (the table is redrawn over them),
// so each interviewer reads as seated in their own chair rather than standing in front of it.
const FIGURE_W = 0.2
const FIGURE_BOTTOM: Record<Seat, number> = { 0: 0.676, 1: 0.666, 2: 0.672 }
// Head-and-torso centerline inside each 1024px-wide portrait (the art is not centered).
const FIGURE_ANCHOR: Record<Seat, number> = { 0: 0.488, 1: 0.49, 2: 0.478 }
const FIGURE_ASPECT = 1.04

export interface StageGeometry {
  w: number
  h: number
  imgW: number
  imgH: number
  seatX: (seat: Seat) => number
  tableY: number
  personW: number
  figureBottom: (seat: Seat) => number
  /** Approximate top of the speaker's head; bubbles and cards anchor here. */
  figureTop: (seat: Seat) => number
}

export function useStageGeometry(ref: RefObject<HTMLElement | null>): StageGeometry | null {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  if (!size || size.w === 0) return null
  return stageGeometry(size.w, size.h)
}

export function stageGeometry(w: number, h: number, { clamp = true }: { clamp?: boolean } = {}): StageGeometry {
  const imgW = Math.max(w, h * IMG_ASPECT)
  const imgH = imgW / IMG_ASPECT
  const cropX = (imgW - w) / 2
  const cropY = (imgH - h) / 2
  const personW = clamp ? Math.max(150, Math.min(400, imgW * FIGURE_W)) : imgW * FIGURE_W
  const figureBottom = (seat: Seat) => FIGURE_BOTTOM[seat] * imgH - cropY
  return {
    w,
    h,
    imgW,
    imgH,
    seatX: seat => CHAIR_X[seat] * imgW - cropX,
    tableY: TABLE_Y * imgH - cropY,
    personW,
    figureBottom,
    figureTop: seat => figureBottom(seat) - personW * 0.98,
  }
}

export function usePreloadSeats() {
  useEffect(() => {
    Object.values(SEAT_IMAGES).forEach(set => Object.values(set).forEach(src => (new Image().src = src)))
    new Image().src = '/room.png'
  }, [])
}

export function RoomBackdrop({
  dim = 0,
  blur = false,
  vignette,
  front,
}: {
  dim?: number
  blur?: boolean
  /** Extra CSS background layered over the room (and over the tabletop in front mode). */
  vignette?: string
  /** Redraw only the tabletop, above the seated figures, so the table hides their laps. */
  front?: StageGeometry
}) {
  const mask = front ? `linear-gradient(to bottom, transparent ${front.tableY - 1.5}px, black ${front.tableY + 1.5}px)` : undefined
  return (
    <div
      className={cx('pointer-events-none absolute inset-0', front && 'z-10')}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-[filter] duration-700"
        style={{ backgroundImage: "url('/room.png')", filter: blur ? 'blur(6px) saturate(0.8)' : undefined }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e1f]/30 via-transparent to-[#0b0e1f]/85" />
      {vignette && <div className="absolute inset-0" style={{ background: vignette }} />}
      <motion.div className="absolute inset-0 bg-[#0b0e1f]" initial={false} animate={{ opacity: dim }} transition={{ duration: 0.6 }} />
    </div>
  )
}

export function SeatFigure({
  geo,
  interviewer,
  active,
  dimmed,
  speaking,
  offsetX = 0,
  tilt = 0,
  onClick,
  visible = true,
}: {
  geo: StageGeometry
  interviewer: Interviewer
  active: boolean
  dimmed: boolean
  speaking: boolean
  offsetX?: number
  tilt?: number
  onClick?: () => void
  visible?: boolean
}) {
  const seat = interviewer.seat
  const expression = REACTIONS[interviewer.reaction].expression
  const src = SEAT_IMAGES[seat][expression]
  // Without a click target the figure is scenery, so it renders as a plain element.
  const Root = onClick ? motion.button : motion.div
  const bottom = geo.h - geo.figureBottom(seat)
  const left = geo.seatX(seat) - geo.personW * FIGURE_ANCHOR[seat]
  return (
    <Root
      {...(onClick ? { type: 'button' as const, onClick, 'aria-label': `${interviewer.name}, ${interviewer.title}. Open details.` } : { 'aria-hidden': true })}
      className="absolute origin-bottom focus:outline-none"
      style={{ left, width: geo.personW, bottom, height: geo.personW * FIGURE_ASPECT }}
      initial={{ opacity: 0, y: 40 }}
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : 40,
        x: offsetX,
        rotate: tilt,
        filter: dimmed ? 'brightness(0.62) saturate(0.85)' : 'brightness(1) saturate(1)',
      }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
    >
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[4%] h-[72%] w-[110%] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: interviewer.color }}
        animate={{ opacity: active ? 0.32 : 0 }}
        transition={{ duration: 0.5 }}
      />
      <AnimatePresence initial={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className="absolute bottom-0 left-0 w-full select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32 }}
          style={{ filter: active ? `drop-shadow(0 0 22px ${interviewer.color}55)` : 'drop-shadow(0 10px 18px rgba(0,0,0,0.45))' }}
        />
      </AnimatePresence>
      {speaking && (
        <span className="pointer-events-none absolute left-1/2 top-[2%] -translate-x-1/2">
          <SpeakingBars color={interviewer.color} />
        </span>
      )}
    </Root>
  )
}

export function SpeakingBars({ color }: { color: string }) {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2, 3].map(i => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: color }}
          animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

export function NamePlate({
  geo,
  interviewer,
  active,
  delta,
  deltaKey,
  onClick,
  compact = false,
  visible = true,
}: {
  geo: StageGeometry
  interviewer: Interviewer
  active: boolean
  delta?: number | null
  deltaKey?: number
  onClick?: () => void
  compact?: boolean
  visible?: boolean
}) {
  const width = Math.min(Math.max(geo.personW * 1.1, 210), 300)
  const x = geo.seatX(interviewer.seat)
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cx('glass absolute z-20 rounded-2xl px-3.5 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70')}
      style={{ left: x - width / 2, width, top: geo.tableY - geo.imgH * 0.022 }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16, scale: active ? 1.03 : 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <span
        className="absolute inset-x-3 top-0 h-[2px] rounded-full"
        style={{ background: interviewer.color, boxShadow: active ? `0 0 14px ${interviewer.color}` : undefined, opacity: active ? 1 : 0.6 }}
      />
      <div className="flex items-center gap-3">
        <div className="relative">
          <ScoreRing value={interviewer.confidence} color={interviewer.color} size={compact ? 44 : 52} label={`${interviewer.name} confidence`} />
          <AnimatePresence>
            {delta != null && delta !== 0 && (
              <motion.span
                key={deltaKey}
                className="font-display pointer-events-none absolute -top-2 left-1/2 text-2xl font-bold tnum"
                style={{ color: delta > 0 ? '#22C55E' : '#F87171', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
                initial={{ opacity: 0, y: 0, x: '-50%', scale: 0.6 }}
                animate={{ opacity: [0, 1, 1, 0], y: -54, scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.2, times: [0, 0.15, 0.7, 1], ease: 'easeOut' }}
              >
                {delta > 0 ? `+${delta}` : delta}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display truncate text-[15px] font-semibold leading-tight" style={{ color: active ? interviewer.color : undefined }}>
            {interviewer.name}
          </p>
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">{interviewer.title}</p>
          <div className="mt-1.5">
            <ReactionChip reaction={interviewer.reaction} />
          </div>
        </div>
      </div>
    </motion.button>
  )
}

export function confidenceDelta(i: Interviewer) {
  const h = i.confidenceHistory
  return h.length > 1 ? h[h.length - 1] - h[h.length - 2] : 0
}

export { AnimatedNumber }
