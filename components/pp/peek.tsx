"use client"

import { CheckCircleIcon, CircleDashedIcon, CircleHalfIcon, QuotesIcon, TargetIcon, XIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { domainLabel } from '@/lib/catalog'
import type { Interviewer, SessionDoc } from '@/lib/types'
import { Avatar, DomainIcon, Kicker, ReactionChip, ScoreRing } from './primitives'

const CONCERN_STATE = {
  open: { label: 'Open', icon: CircleDashedIcon, color: '#a6acc9' },
  probed: { label: 'Asked, not settled', icon: CircleHalfIcon, color: '#F59E0B' },
  resolved: { label: 'Resolved', icon: CheckCircleIcon, color: '#22C55E' },
} as const

export function PeekPanel({ session, interviewerId, onClose }: { session: SessionDoc; interviewerId: string | null; onClose: () => void }) {
  const p = session.panel.find(x => x.id === interviewerId) ?? null
  return (
    <AnimatePresence>
      {p && (
        <motion.aside
          key={p.id}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="absolute inset-y-0 right-0 z-40 flex w-full flex-col overflow-hidden rounded-[22px] border border-white/15 bg-[#141833] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)]"
          role="dialog"
          aria-label={`Behind the panel: ${p.name}`}
        >
          <PeekBody session={session} p={p} onClose={onClose} />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function PeekBody({ session, p, onClose }: { session: SessionDoc; p: Interviewer; onClose: () => void }) {
  const turns = session.turns.filter(t => t.interviewerId === p.id && t.attempts.length)
  const last = turns[turns.length - 1]?.attempts.at(-1)?.result
  return (
    <>
      <div className="flex items-start gap-3 border-b border-line p-5">
        <Avatar seat={p.seat} size={52} ring={p.color} />
        <div className="min-w-0 flex-1">
          <Kicker>Behind the panel</Kicker>
          <p className="font-display mt-1 text-lg font-semibold leading-tight" style={{ color: p.color }}>
            {p.name}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <DomainIcon domain={p.domain} className="h-3.5 w-3.5" /> {p.title} · {domainLabel(p.domain)}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-faint transition hover:bg-white/5 hover:text-ink">
          <XIcon weight="bold" className="h-5 w-5" />
        </button>
      </div>

      <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto p-5">
        <div className="flex items-center gap-4 rounded-2xl bg-black/25 p-4">
          <ScoreRing value={p.confidence} color={p.color} size={64} stroke={6} />
          <div>
            <p className="text-xs text-ink-faint">How convinced {p.name.split(' ')[0]} is</p>
            <div className="mt-1.5">
              <ReactionChip reaction={p.reaction} size="md" />
            </div>
            <p className="mt-1.5 text-[11px] text-ink-faint tnum">
              Started at {p.startConfidence}% · {p.confidence - p.startConfidence >= 0 ? '+' : ''}
              {p.confidence - p.startConfidence} so far
            </p>
          </div>
        </div>

        <Section title="Why I joined">
          <p className="text-sm leading-relaxed text-ink">{p.joinReason}</p>
        </Section>

        <Section title="What I'm looking for">
          <p className="flex gap-2 text-sm leading-relaxed text-ink">
            <TargetIcon weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: p.color }} />
            {last?.lookingFor || p.lookingFor}
          </p>
        </Section>

        {last && (last.criteriaMet.length > 0 || last.criteriaMissed.length > 0) && (
          <Section title="Your last answer">
            <ul className="space-y-1.5">
              {last.criteriaMet.map(c => (
                <li key={`m${c}`} className="flex items-center gap-2 text-sm text-ink">
                  <CheckCircleIcon weight="duotone" className="h-4 w-4 shrink-0 text-good" /> {c}
                </li>
              ))}
              {last.criteriaMissed.map(c => (
                <li key={`x${c}`} className="flex items-center gap-2 text-sm text-ink-muted">
                  <CircleDashedIcon weight="duotone" className="h-4 w-4 shrink-0 text-warn" /> {c}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex gap-2 rounded-xl bg-black/25 p-3 text-[13px] italic leading-relaxed text-ink-muted">
              <QuotesIcon weight="duotone" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
              {last.evidenceQuote}
            </p>
          </Section>
        )}

        <Section title="My doubts">
          <ul className="space-y-2">
            {p.concerns.map(c => {
              const meta = CONCERN_STATE[c.state]
              const Icon = meta.icon
              return (
                <li key={c.id} className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2.5">
                  <Icon weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta.color }} aria-hidden />
                  <div className="min-w-0">
                    <p className={c.state === 'resolved' ? 'text-sm text-ink-muted line-through decoration-white/30' : 'text-sm text-ink'}>{c.text}</p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: meta.color }}>
                      {meta.label}
                      {c.origin === 'answer' ? ' · raised by your answer' : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Section>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <Kicker className="mb-2">{title}</Kicker>
      {children}
    </section>
  )
}
