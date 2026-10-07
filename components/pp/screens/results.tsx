"use client"

import {
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BarbellIcon,
  CheckIcon,
  FilePdfIcon,
  FilmSlateIcon,
  FlagCheckeredIcon,
  GiftIcon,
  HourglassIcon,
  InfoIcon,
  ListChecksIcon,
  LockKeyIcon,
  PlusIcon,
  QuotesIcon,
  SealQuestionIcon,
  ShootingStarIcon,
  TargetIcon,
  ThumbsUpIcon,
  TrashIcon,
  TrendUpIcon,
  TrophyIcon,
  WarningCircleIcon,
  type Icon,
} from '@phosphor-icons/react'
import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { REACTIONS, VERDICTS } from '@/lib/catalog'
import { DEMO_STUDENT } from '@/lib/demo'
import { downloadCoachingReport } from '@/lib/report-pdf'
import { sfx } from '@/lib/sfx'
import { usePanel } from '@/lib/store'
import type { EvalResult, Interviewer, Outcome, SessionDoc, Turn, VerdictLabel } from '@/lib/types'
import { CoachMark } from '../coach'
import { AnimatedNumber, Avatar, BackButton, DomainIcon, Kicker, Logo, cx } from '../primitives'

const ZONES: { label: VerdictLabel; from: number; to: number; icon: Icon }[] = [
  { label: 'Keep Practicing', from: 0, to: 40, icon: BarbellIcon },
  { label: 'Rising Star', from: 40, to: 70, icon: ShootingStarIcon },
  { label: 'Interview Ready', from: 70, to: 100, icon: TrophyIcon },
]

const GOLD = '#FFC627'

const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 160, damping: 20 } } }

export function ResultsScreen() {
  const { session, config } = usePanel()
  const go = usePanel(s => s.go)
  const reset = usePanel(s => s.reset)
  const back = usePanel(s => s.back)
  const rematch = usePanel(s => s.rematch)
  const deleteSession = usePanel(s => s.deleteSession)
  const fired = useRef(false)

  const outcome = session?.outcome
  const ready = outcome?.verdict.label === 'Interview Ready'

  useEffect(() => {
    if (!outcome || fired.current) return
    fired.current = true
    const t = setTimeout(() => {
      if (ready) {
        sfx.celebrate()
        const colors = ['#FFC627', '#A78BFA', '#2DD4BF', '#FB923C', '#ffffff']
        confetti({ particleCount: 110, spread: 75, startVelocity: 48, origin: { x: 0.2, y: 0.3 }, colors })
        confetti({ particleCount: 110, spread: 75, startVelocity: 48, origin: { x: 0.8, y: 0.3 }, colors })
        setTimeout(() => confetti({ particleCount: 80, spread: 120, startVelocity: 30, origin: { x: 0.5, y: 0.2 }, colors }), 400)
      } else sfx.reveal()
    }, 700)
    return () => clearTimeout(t)
  }, [outcome, ready])

  if (!session || !outcome) return null
  const meta = VERDICTS[outcome.verdict.label]
  const VerdictIcon = ZONES.find(z => z.label === outcome.verdict.label)!.icon
  const s = outcome.stats
  const toughest = session.panel.length > 1 ? session.panel.find(p => p.id === s.toughestCritic) : undefined
  const live = Boolean(config?.live)
  const answered = session.turns.filter(t => t.attempts.length > 0).length

  return (
    <motion.div className="lift-bg relative min-h-screen overflow-x-clip text-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      {/* The app's own navy, one step lighter than the interview room: the debrief should feel open, not dim. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px]" style={{ background: `radial-gradient(ellipse 50% 70% at 50% 0%, ${meta.color}2e, transparent 70%)` }} />
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[900px] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <section className="relative">
        <div className="relative mx-auto max-w-[1200px] px-6 pb-12 lg:px-10">
          <header className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <BackButton onClick={back} label="Home" />
              <button type="button" onClick={reset} aria-label="Back to start">
                <Logo size="sm" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-white/10 px-3 py-1 text-xs text-white/85 ring-1 ring-white/15 sm:inline">
                {session.kind === 'rematch' ? 'Rematch · ' : ''}
                {session.setup.roleTitle} · {session.setup.level}
              </span>
              {session.mode === 'demo' && <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-[#1a1300]">Sample session</span>}
            </div>
          </header>

          <div className="flex flex-col items-center pt-2 text-center">
            <Medallion overall={outcome.verdict.overall} color={meta.color} />
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <Kicker className="mt-6 text-gold">Your interview readiness</Kicker>
              <h1 className="font-display mt-3 flex items-center justify-center gap-3.5 text-[clamp(38px,5vw,62px)] font-semibold leading-none">
                <span className="flex h-[1.05em] w-[1.05em] items-center justify-center rounded-[0.28em]" style={{ color: meta.color, background: `${meta.color}1f`, boxShadow: `inset 0 0 0 1px ${meta.color}55` }}>
                  <VerdictIcon weight="duotone" className="h-[0.62em] w-[0.62em]" />
                </span>
                {outcome.verdict.label}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[17px] text-white/80">{meta.blurb}</p>
              {session.endedEarly && (
                <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[13px] text-white/75 ring-1 ring-white/10">
                  <FlagCheckeredIcon weight="duotone" className="h-4 w-4 text-gold" />
                  You ended after {answered} of {session.config.maxTurns} questions. Everything below reflects only what you answered.
                </p>
              )}
            </motion.div>
            <ScoreScale overall={outcome.verdict.overall} />
          </div>
        </div>
      </section>


      <section className="mx-auto mt-4 max-w-[1200px] px-6 lg:px-10">
        <SectionTitle kicker="Panel feedback" title="How each interviewer saw you" />
        <motion.div className="mt-5 grid gap-4 md:grid-cols-3" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
          {session.panel.map(p => (
            <InterviewerCard
              key={p.id}
              p={p}
              asked={session.turns.filter(t => t.interviewerId === p.id && t.attempts.length > 0).length}
              outcome={outcome}
              canRematch={p.concerns.some(c => c.state !== 'resolved')}
              live={live}
              onRematch={() => void rematch(p.id)}
            />
          ))}
        </motion.div>
      </section>

      <section className="mx-auto mt-12 grid max-w-[1200px] items-start gap-5 px-6 lg:grid-cols-[1.12fr_1fr] lg:px-10">
        <CoachNote session={session} outcome={outcome} />
        <PlanCard outcome={outcome} />
      </section>

      <section className="mx-auto mt-12 max-w-[1200px] px-6 lg:px-10">
        <SectionTitle kicker="Keep going" title="Take your session with you" />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <ActionCard
            icon={<GiftIcon weight="duotone" className="h-6 w-6" />}
            tint="#FFC627"
            title="Mockify Wrapped"
            text="Your shareable recap and readiness journey."
            onClick={() => go('wrapped')}
            primary
          />
          <ActionCard
            icon={<FilePdfIcon weight="duotone" className="h-6 w-6" />}
            tint="#A78BFA"
            title="Coaching Report"
            text="Your strengths, what to work on, Sam's note, and every question with feedback."
            onClick={() => void downloadCoachingReport(session)}
          />
          <ActionCard
            icon={<FilmSlateIcon weight="duotone" className="h-6 w-6" />}
            tint="#2DD4BF"
            title="Highlight Reel"
            text="Replay the three answers that moved your panel most."
            onClick={() => go('reel')}
          />
        </div>
      </section>

      <footer className="mx-auto mt-12 flex max-w-[1200px] flex-wrap items-center justify-between gap-4 border-t border-line px-6 pb-14 pt-6 lg:px-10">
        <p className="flex max-w-xl items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <LockKeyIcon weight="duotone" className="mt-px h-4 w-4 shrink-0 text-ink-faint" />
          A practice signal for you alone: never a hiring decision, never shared with employers. Review it with a career advisor if it helps.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {toughest && toughest.concerns.some(c => c.state !== 'resolved') && (
            <button
              type="button"
              onClick={() => void rematch(toughest.id)}
              disabled={!live}
              title={live ? undefined : 'A rematch is a live conversation and needs a CreateAI token'}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 ring-white/15 transition hover:ring-white/30 disabled:opacity-45"
              style={{ color: toughest.color }}
            >
              <ArrowCounterClockwiseIcon weight="bold" className="h-4 w-4" /> Rematch {toughest.name.split(' ')[0]}
            </button>
          )}
          <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-white/15 transition hover:ring-white/30">
            <PlusIcon weight="bold" className="h-4 w-4" /> New session
          </button>
          <button type="button" onClick={() => void deleteSession()} className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink-muted transition hover:text-bad">
            <TrashIcon weight="duotone" className="h-4 w-4" /> Delete this session
          </button>
        </div>
      </footer>
    </motion.div>
  )
}

function Medallion({ overall, color }: { overall: number; color: string }) {
  const size = 200
  const r = 82
  const c = 2 * Math.PI * r
  const mid = size / 2
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      initial={{ y: -150, scale: 0.5, rotate: -25, opacity: 0 }}
      animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 140, damping: 11, delay: 0.25 }}
    >
      <motion.div className="absolute inset-3 rounded-full blur-2xl" style={{ background: color }} animate={{ opacity: [0.3, 0.55, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
      <svg width={size} height={size} className="relative">
        <defs>
          <radialGradient id="medal-fill" cx="40%" cy="32%" r="78%">
            <stop offset="0%" stopColor="#2c3370" />
            <stop offset="100%" stopColor="#11142e" />
          </radialGradient>
        </defs>
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * Math.PI * 2
          const r1 = 93
          const r2 = i % 5 === 0 ? 99 : 96
          return (
            <line
              key={i}
              x1={mid + Math.cos(a) * r1}
              y1={mid + Math.sin(a) * r1}
              x2={mid + Math.cos(a) * r2}
              y2={mid + Math.sin(a) * r2}
              stroke={color}
              strokeOpacity={i % 5 === 0 ? 0.9 : 0.4}
              strokeWidth={1.5}
            />
          )
        })}
        <circle cx={mid} cy={mid} r={88} fill="url(#medal-fill)" stroke={color} strokeOpacity={0.5} />
        <circle cx={mid} cy={mid} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={7} />
        <motion.circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          transform={`rotate(-90 ${mid} ${mid})`}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - overall / 100) }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={overall} suffix="%" duration={1.6} className="font-display text-[46px] font-semibold leading-none" />
        <span className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/70">Panel confidence</span>
      </div>
    </motion.div>
  )
}

function ScoreScale({ overall }: { overall: number }) {
  const current = ZONES.find(z => overall >= z.from && overall < z.to) ?? ZONES[ZONES.length - 1]
  const next = ZONES.find(z => z.from > overall)
  return (
    <motion.div className="mt-10 w-[min(640px,100%)]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
      <div className="relative">
        <div className="flex h-2.5 gap-[3px]" role="img" aria-label={`${overall}% sits in ${current.label}. Bands: Keep Practicing under 40, Rising Star 40 to 69, Interview Ready 70 and above.`}>
          {ZONES.map(z => (
            <div key={z.label} className="h-full rounded-full" style={{ width: `${z.to - z.from}%`, background: VERDICTS[z.label].color, opacity: z === current ? 1 : 0.3 }} />
          ))}
        </div>
        <motion.div
          className="absolute top-1/2"
          initial={{ left: '0%' }}
          animate={{ left: `${Math.max(1.5, Math.min(98.5, overall))}%` }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
        >
          <span className="absolute bottom-[calc(100%+12px)] left-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-stage shadow-lg">You</span>
          <span
            className="absolute left-0 top-0 block h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ boxShadow: `0 0 0 4px ${VERDICTS[current.label].color}80, 0 4px 14px rgba(0,0,0,0.35)` }}
          />
        </motion.div>
      </div>
      <div className="mt-3.5 flex text-left text-[12.5px]">
        {ZONES.map(z => (
          <div key={z.label} className={cx('flex items-center gap-1.5 pl-0.5', z === current ? 'font-semibold text-white' : 'text-white/55')} style={{ width: `${z.to - z.from}%` }}>
            <z.icon weight="duotone" className="h-4 w-4 shrink-0" style={{ color: VERDICTS[z.label].color }} />
            <span className="truncate">{z.label}</span>
            {z.from > 0 && <span className="ml-auto pr-1 font-mono text-[10px] text-white/45 sm:hidden">{z.from}</span>}
          </div>
        ))}
      </div>
      <p className="mt-5 flex items-center justify-center gap-2 text-sm text-white/80">
        {next ? (
          <>
            <TrendUpIcon weight="duotone" className="h-4 w-4 text-gold" />
            You are <b className="font-semibold text-white">{next.from - overall} points</b> from {next.label}.
          </>
        ) : (
          <>
            <TrophyIcon weight="duotone" className="h-4 w-4 text-gold" />
            You cleared the Interview Ready bar by <b className="font-semibold text-white">{overall - 70} points</b>.
          </>
        )}
      </p>
      <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-white/55">
        <InfoIcon weight="duotone" className="h-3.5 w-3.5" /> Panel confidence is the average of how convinced each interviewer ended up.
      </p>
    </motion.div>
  )
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <Kicker className="text-gold">{kicker}</Kicker>
      <h2 className="font-display mt-1.5 text-[26px] font-semibold leading-tight">{title}</h2>
    </div>
  )
}

function InterviewerCard({
  p,
  asked,
  outcome,
  canRematch,
  live,
  onRematch,
}: {
  p: Interviewer
  asked: number
  outcome: Outcome
  canRematch: boolean
  live: boolean
  onRematch: () => void
}) {
  const fb = outcome.perInterviewer.find(x => x.interviewerId === p.id)
  const ink = p.color
  const nextDoubt = p.concerns.find(c => c.state !== 'resolved')
  return (
    <motion.article variants={rise} className="lift-card relative flex flex-col overflow-hidden rounded-[22px] p-5">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: p.color }} />
      <div className="flex items-center gap-3">
        <Avatar seat={p.seat} size={52} expression={REACTIONS[p.reaction].expression} ring={p.color} />
        <div className="min-w-0 flex-1">
          <p className="font-display truncate font-semibold leading-tight">{p.name}</p>
          <p className="flex items-center gap-1 truncate text-xs text-ink-muted">
            <DomainIcon domain={p.domain} className="h-3.5 w-3.5 shrink-0" style={{ color: ink }} /> {p.title}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-[30px] font-semibold leading-none">{p.confidence}%</p>
          <p className="mt-1 text-[11px] text-ink-faint">{asked ? 'convinced' : 'from your resume'}</p>
        </div>
      </div>
      {asked ? (
        <ConfidenceShift start={p.startConfidence} end={p.confidence} color={p.color} />
      ) : (
        <p className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-ink-muted ring-1 ring-white/10">
          <HourglassIcon weight="duotone" className="h-3.5 w-3.5" style={{ color: ink }} /> Didn&apos;t get to ask. Their view is from your resume alone.
        </p>
      )}
      <div className="mt-5 space-y-4">
        {fb?.strongest && (
          <Note icon={<TrophyIcon weight="duotone" className="h-[18px] w-[18px]" />} color={GOLD} label="Strongest moment">
            <span className="font-medium">{fb.strongest}</span>
          </Note>
        )}
        {!asked && nextDoubt && (
          <Note icon={<SealQuestionIcon weight="duotone" className="h-[18px] w-[18px]" />} color={ink} label="They planned to ask about">
            <span className="font-medium">{nextDoubt.text}</span>
          </Note>
        )}
        {fb?.takeaway && (
          <Note icon={<TargetIcon weight="duotone" className="h-[18px] w-[18px]" />} color={ink} label="Do this next">
            <span className="text-ink-muted">{fb.takeaway}</span>
          </Note>
        )}
      </div>
      {canRematch && (
        <button
          type="button"
          onClick={onRematch}
          disabled={!live}
          title={live ? `Face only ${p.name.split(' ')[0]}'s remaining doubts` : 'A rematch is a live conversation and needs a CreateAI token'}
          className="mt-auto inline-flex items-center gap-1.5 self-start pt-5 text-[13px] font-semibold transition hover:opacity-75 disabled:opacity-45"
          style={{ color: ink }}
        >
          <ArrowCounterClockwiseIcon weight="bold" className="h-3.5 w-3.5" /> Rematch {p.name.split(' ')[0]}
        </button>
      )}
    </motion.article>
  )
}

// Before-and-after on one track: hollow dot where they started, filled dot where they ended.
function ConfidenceShift({ start, end, color }: { start: number; end: number; color: string }) {
  const delta = end - start
  const up = delta >= 0
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-ink-faint">Started at {start}%</span>
        <span className={cx('inline-flex items-center gap-0.5 font-semibold', delta === 0 ? 'text-ink-muted' : up ? 'text-good' : 'text-bad')}>
          {delta !== 0 && (up ? <ArrowUpIcon weight="bold" className="h-3 w-3" /> : <ArrowDownIcon weight="bold" className="h-3 w-3" />)}
          {delta === 0 ? 'No change' : `${up ? '+' : ''}${delta} points`}
        </span>
      </div>
      <div className="relative mt-2.5 h-2 rounded-full bg-white/10" role="img" aria-label={`Confidence went from ${start}% to ${end}%`}>
        <motion.span
          className="absolute inset-y-0 rounded-full"
          style={{ background: color, opacity: 0.5 }}
          initial={{ left: `${start}%`, width: '0%' }}
          whileInView={{ left: `${Math.min(start, end)}%`, width: `${Math.abs(delta)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
        <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[#1f2450]" style={{ left: `${start}%`, borderColor: color }} />
        <motion.span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#1f2450]"
          style={{ background: color, boxShadow: `0 2px 8px ${color}88` }}
          initial={{ left: `${start}%` }}
          whileInView={{ left: `${end}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>
    </div>
  )
}

function Note({ icon, color, label, children }: { icon: React.ReactNode; color: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em]" style={{ color }}>
          {label}
        </p>
        <p className="mt-0.5 text-[14px] leading-snug">{children}</p>
      </div>
    </div>
  )
}

// Sam is the coach who sat beside the student through the interview and offered the Lifeline. This is Sam's
// note to that student (Maya in the demo), written once the panel finished, from what was actually said.
function CoachNote({ session, outcome }: { session: SessionDoc; outcome: Outcome }) {
  const student = session.mode === 'demo' ? DEMO_STUDENT : null
  const best = bestMoment(session)
  const who = best ? session.panel.find(p => p.id === best.turn.interviewerId) : null
  const c = outcome.coach
  return (
    <motion.article
      className="relative overflow-hidden rounded-[24px] border border-gold/25 bg-gradient-to-br from-[#2b2615] via-[#211f33] to-[#1f2450] p-6"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <QuotesIcon weight="duotone" className="absolute right-5 top-5 h-14 w-14 text-gold/35" />
      <header className="relative flex items-start gap-3.5 pr-14">
        <CoachMark size={48} glow />
        <div>
          <Kicker className="text-gold">Coach&apos;s note</Kicker>
          <h3 className="font-display mt-1 text-[22px] font-semibold leading-tight">Sam&apos;s note to {student ?? 'you'}</h3>
          <p className="mt-1 text-[13px] leading-snug text-ink-muted">
            Sam coached {student ?? 'you'} through this interview and wrote this once the panel finished, from what was actually said.
          </p>
        </div>
      </header>

      {best && who && (
        <figure className="relative mt-5 rounded-2xl bg-black/25 p-4 ring-1 ring-white/[0.07]">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold">{student ? `${student}'s best moment` : 'Your best moment'}</p>
          <blockquote className="mt-1.5 text-[15px] italic leading-snug text-ink">“{best.result.evidenceQuote}”</blockquote>
          <figcaption className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-muted">
            <Avatar seat={who.seat} size={20} ring={who.color} />
            <span>
              <span className="font-semibold" style={{ color: who.color }}>
                {who.name.split(' ')[0]}
              </span>
              , {who.title}: {REACTIONS[best.result.reaction].label.toLowerCase()}, <span className="font-semibold text-good">+{best.result.scoreDelta}</span>
            </span>
            {best.turn.attempts.length > 1 && <span className="text-ink-faint">· on the second try, after the Lifeline</span>}
            {best.turn.kind === 'follow-up' && <span className="text-ink-faint">· a follow-up question</span>}
          </figcaption>
        </figure>
      )}

      {c ? (
        <div className="relative mt-5 space-y-4">
          <Note icon={<ThumbsUpIcon weight="duotone" className="h-[18px] w-[18px]" />} color="#22C55E" label="What went well">
            {c.wentWell}
          </Note>
          {c.heldBack && (
            <Note icon={<WarningCircleIcon weight="duotone" className="h-[18px] w-[18px]" />} color="#F59E0B" label={`What held ${student ?? 'you'} back`}>
              {c.heldBack}
            </Note>
          )}
          <Note icon={<TargetIcon weight="duotone" className="h-[18px] w-[18px]" />} color={GOLD} label={student ? `${student}'s next step` : 'Your next step'}>
            <span className="font-medium">{c.nextStep}</span>
          </Note>
        </div>
      ) : (
        <p className="relative mt-4 text-[15.5px] leading-relaxed text-ink">{outcome.coachSummary}</p>
      )}
    </motion.article>
  )
}

// The answer that moved an interviewer the most, with the student's own words.
function bestMoment(session: SessionDoc) {
  let best: { turn: Turn; result: EvalResult } | null = null
  for (const t of session.turns) {
    const last = t.attempts[t.attempts.length - 1]
    if (last && last.result.scoreDelta > 0 && (!best || last.result.scoreDelta > best.result.scoreDelta)) best = { turn: t, result: last.result }
  }
  return best
}

function PlanCard({ outcome }: { outcome: Outcome }) {
  const [done, setDone] = useState<Record<number, boolean>>({})
  return (
    <motion.div className="lift-card rounded-[24px] p-6" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/12 text-gold">
          <ListChecksIcon weight="duotone" className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-[17px] font-semibold leading-tight">Your plan this week</p>
          <p className="text-xs text-ink-muted">Tick them off as you go</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {outcome.topPractice.map((t, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setDone(d => ({ ...d, [i]: !d[i] }))}
              className="flex w-full items-start gap-3 rounded-xl bg-white/[0.04] px-3.5 py-3 text-left text-[14px] leading-snug transition hover:bg-white/[0.07]"
              aria-pressed={Boolean(done[i])}
            >
              <span className={cx('mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition', done[i] ? 'bg-good text-stage' : 'ring-1 ring-white/25')}>
                {done[i] && <CheckIcon weight="bold" className="h-3.5 w-3.5" />}
              </span>
              <span className={done[i] ? 'text-ink-faint line-through' : ''}>{t}</span>
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function ActionCard({ icon, tint, title, text, onClick, primary }: { icon: React.ReactNode; tint: string; title: string; text: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'group flex items-center gap-4 rounded-[22px] p-5 text-left transition hover:-translate-y-0.5',
        primary ? 'lift-card bg-gradient-to-br from-gold/[0.14] to-transparent ring-1 ring-gold/35' : 'lift-card hover:ring-1 hover:ring-white/20',
      )}
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105"
        style={{ background: `${tint}1f`, color: tint }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display block font-semibold">{title}</span>
        <span className="block text-sm text-ink-muted">{text}</span>
      </span>
      <ArrowRightIcon weight="bold" className={cx('h-4 w-4 transition group-hover:translate-x-0.5', primary ? 'text-gold' : 'text-ink-faint group-hover:text-ink')} />
    </button>
  )
}
