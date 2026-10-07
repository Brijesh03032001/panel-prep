"use client"

import { ArrowCounterClockwiseIcon, ArrowElbowDownRightIcon, EyeIcon, QuotesIcon, SealCheckIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'
import type { Beat } from '@/lib/store'
import type { Interviewer, SessionDoc, Turn } from '@/lib/types'
import { ReactionChip, deep } from './primitives'
import type { StageGeometry } from './stage'

export function SpeechBubble({
  geo,
  session,
  interviewer,
  turn,
  progress,
  beat,
  retrying,
  onPeek,
}: {
  geo: StageGeometry
  session: SessionDoc
  interviewer: Interviewer
  turn: Turn
  progress: number
  beat: Beat | null
  retrying: boolean
  onPeek: () => void
}) {
  const width = Math.min(600, geo.w - 32)
  const x = geo.seatX(interviewer.seat)
  const left = Math.max(16, Math.min(geo.w - width - 16, x - width / 2))
  const arrow = Math.max(28, Math.min(width - 28, x - left))
  const anchorY = Math.min(geo.h - 120, geo.figureTop(interviewer.seat) - 6)
  const box = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Sit just above the speaker's head, but never slide under the top bar; a tall bubble overlaps the head instead.
  const top = Math.max(76, anchorY - height)
  const words = turn.question.split(/\s+/)
  const shown = Math.ceil(progress * words.length)
  const bridge = turn.buildsOn ? session.panel.find(p => p.name.startsWith(turn.buildsOn!)) : null
  const showResult = beat && beat.turnId === turn.id

  return (
    <motion.div
      ref={box}
      className="absolute z-30"
      style={{ left, width, top, visibility: height ? 'visible' : 'hidden' }}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      <div className="relative rounded-[22px] bg-[#fbfbfd] text-[#121528] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-y-4 left-0 w-1 rounded-r-full" style={{ background: interviewer.color }} />
        <div className="px-6 pb-5 pt-4">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold">
            <span style={{ color: deep(interviewer.color) }}>{interviewer.name.split(' ')[0]}</span>
            <span className="font-normal text-[#5b6180]">{interviewer.title}</span>
            {turn.kind === 'follow-up' && <Tag icon={<ArrowElbowDownRightIcon weight="bold" className="h-3 w-3" />}>Follow-up</Tag>}
            {bridge && <Tag icon={<ArrowElbowDownRightIcon weight="bold" className="h-3 w-3" />}>Building on {bridge.name.split(' ')[0]}</Tag>}
            {retrying && !showResult && <Tag icon={<ArrowCounterClockwiseIcon weight="bold" className="h-3 w-3" />}>Second try</Tag>}
          </div>
          {turn.anchor && !showResult && (
            <p className="mb-2.5 flex items-start gap-2 rounded-xl bg-[#f1f2f8] px-3 py-2 text-[12.5px] leading-snug text-[#4a5072]">
              <QuotesIcon weight="duotone" className="mt-px h-3.5 w-3.5 shrink-0" style={{ color: deep(interviewer.color) }} />
              <span>
                <span className="font-semibold">{turn.kind === 'follow-up' ? 'You just said' : 'Earlier you said'}</span>{' '}
                <span className="italic">“{turn.anchor}”</span>
              </span>
            </p>
          )}
          <p
            className={`font-display font-medium leading-snug transition-[font-size] duration-300 ${showResult ? 'text-[15px] text-[#3c4160]' : 'text-[clamp(17px,1.35vw,21px)]'}`}
            aria-live="polite"
          >
            {words.map((w, i) => (
              <span key={i} className="transition-opacity duration-200" style={{ opacity: i < shown ? 1 : 0.22 }}>
                {w}{' '}
              </span>
            ))}
          </p>
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-2xl bg-[#121528] px-4 py-3.5 text-[#f5f5f7]">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReactionChip reaction={beat.result.reaction} size="md" />
                    <span
                      className="font-display text-sm font-bold tnum"
                      style={{ color: beat.result.scoreDelta >= 0 ? '#22C55E' : '#F87171' }}
                    >
                      {beat.result.scoreDelta > 0 ? '+' : ''}
                      {beat.result.scoreDelta} confidence
                    </span>
                    <button
                      type="button"
                      onClick={onPeek}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-ink-muted ring-1 ring-white/15 transition hover:text-ink hover:ring-white/30"
                    >
                      <EyeIcon weight="duotone" className="h-3.5 w-3.5" /> Peek behind the panel
                    </button>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">
                    Because you said{' '}
                    <span className="font-medium italic text-ink">“{beat.result.evidenceQuote}”</span>
                    {beat.result.evidenceVerified && (
                      <span className="ml-1.5 inline-flex translate-y-[2px] items-center gap-0.5 text-[10px] font-medium text-good" title="Quoted word for word from your answer">
                        <SealCheckIcon weight="duotone" className="h-3 w-3" /> your words
                      </span>
                    )}
                  </p>
                  {beat.result.feedback && <p className="mt-1.5 text-[13px] leading-relaxed text-ink">{beat.result.feedback}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span
          className="absolute -bottom-[9px] h-5 w-5 rotate-45 rounded-[3px] bg-[#fbfbfd]"
          style={{ left: arrow - 10 }}
          aria-hidden
        />
      </div>
    </motion.div>
  )
}

function Tag({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#eef0f8] px-2 py-0.5 text-[11px] font-medium text-[#4a5072]">
      {icon}
      {children}
    </span>
  )
}
