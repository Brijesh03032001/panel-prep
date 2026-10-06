"use client"

import { LifebuoyIcon, XIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CoachMsg } from '@/lib/store'

export function CoachMark({ size = 40, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full font-display font-bold text-[#1a1300]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: 'radial-gradient(circle at 35% 30%, #ffe08a, #ffc627 55%, #d99a00)',
        boxShadow: glow ? '0 0 0 4px rgba(255,198,39,0.18), 0 0 28px rgba(255,198,39,0.55)' : '0 0 0 3px rgba(255,198,39,0.15)',
      }}
      aria-hidden
    >
      S
    </div>
  )
}

export function CoachCard({ coach, onDismiss }: { coach: CoachMsg | null; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {coach && (
        <motion.aside
          key={coach.kind + coach.text}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="relative w-full overflow-hidden rounded-[22px] border border-gold/30 bg-[#17140a]/90 p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          aria-live="polite"
        >
          <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative flex gap-3">
            <CoachMark size={38} glow={coach.kind === 'hint' || coach.kind === 'thinking'} />
            <div className="min-w-0 flex-1">
              <p className="font-display flex items-center gap-1.5 text-sm font-semibold text-gold">
                Sam · Coach
                {coach.kind === 'hint' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium">
                    <LifebuoyIcon weight="duotone" className="h-3 w-3" /> Hint only
                  </span>
                )}
              </p>
              {coach.title && <p className="mt-1 text-[13px] font-medium text-ink">{coach.title}</p>}
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                {coach.kind === 'thinking' ? <ThinkingDots text={coach.text} /> : coach.text}
              </p>
            </div>
            {coach.kind !== 'thinking' && (
              <button type="button" onClick={onDismiss} aria-label="Dismiss coach" className="self-start rounded-md p-1 text-ink-faint transition hover:text-ink">
                <XIcon weight="bold" className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function ThinkingDots({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {text}
      <span className="inline-flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-gold" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </span>
    </span>
  )
}
