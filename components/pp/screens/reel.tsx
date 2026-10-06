"use client"

import { ArrowLeftIcon, DownloadSimpleIcon, LifebuoyIcon, PauseIcon, PlayIcon, SparkleIcon } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { downloadCoachingReport } from '@/lib/report-pdf'
import { usePanel } from '@/lib/store'
import type { Attempt, SessionDoc, Turn } from '@/lib/types'
import { Avatar, Kicker, Logo, ReactionChip } from '../primitives'

interface Moment {
  turn: Turn
  attempt: Attempt
  attemptNo: number
}

function topMoments(session: SessionDoc): Moment[] {
  const all: Moment[] = []
  session.turns.forEach(turn => turn.attempts.forEach((attempt, i) => all.push({ turn, attempt, attemptNo: i + 1 })))
  return all.sort((a, b) => Math.abs(b.attempt.result.scoreDelta) - Math.abs(a.attempt.result.scoreDelta)).slice(0, 3)
}

export function ReelScreen() {
  const { session, recordings } = usePanel()
  const go = usePanel(s => s.go)
  if (!session) return null
  const moments = topMoments(session)

  return (
    <motion.div className="relative min-h-screen bg-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_50%_70%_at_50%_0%,rgba(45,212,191,0.14),transparent_70%)]" />
      <div className="relative z-10 mx-auto max-w-[1180px] px-6 pb-16 lg:px-10">
        <header className="flex h-16 items-center justify-between">
          <Logo size="sm" />
          <button type="button" onClick={() => go('verdict')} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm text-ink-muted ring-1 ring-white/15 transition hover:text-ink">
            <ArrowLeftIcon weight="bold" className="h-4 w-4" /> Back to verdict
          </button>
        </header>

        <div className="pt-8 text-center">
          <Kicker className="text-[#2DD4BF]">Highlight Reel</Kicker>
          <h1 className="font-display mt-3 text-[clamp(32px,3.6vw,48px)] font-semibold">The answers that moved the room</h1>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            The three moments that changed your panel&apos;s mind the most, with the exact words that did it.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {moments.map((m, i) => (
            <MomentCard key={`${m.turn.id}-${m.attemptNo}`} session={session} moment={m} rank={i} audioUrl={recordings[`${m.turn.id}:${m.attemptNo}`] ?? null} />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => void downloadCoachingReport(session)} className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium ring-1 ring-white/15 transition hover:ring-white/30">
            <DownloadSimpleIcon weight="bold" className="h-4 w-4" /> Download Coaching Report
          </button>
          <button type="button" onClick={() => go('wrapped')} className="gold-btn inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
            <SparkleIcon weight="duotone" className="h-4 w-4" /> See your Wrapped
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function MomentCard({ session, moment, rank, audioUrl }: { session: SessionDoc; moment: Moment; rank: number; audioUrl: string | null }) {
  const { turn, attempt, attemptNo } = moment
  const p = session.panel.find(x => x.id === turn.interviewerId)!
  const r = attempt.result
  const positive = r.scoreDelta >= 0
  const comeback = attemptNo > 1 && positive
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + rank * 0.12, type: 'spring', stiffness: 140, damping: 18 }}
      className="glass relative flex flex-col overflow-hidden rounded-[24px]"
    >
      <div className="relative px-6 pb-5 pt-6" style={{ background: `linear-gradient(180deg, ${p.color}1f, transparent)` }}>
        <div className="flex items-center gap-3">
          <Avatar seat={p.seat} size={44} expression={positive ? (p.seat === 1 ? 'neutral' : 'smile') : 'worse'} ring={p.color} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: p.color }}>
              {p.name}
            </p>
            <p className="text-xs text-ink-faint">{p.title}</p>
          </div>
          <span className="font-display text-4xl font-bold tnum" style={{ color: positive ? '#22C55E' : '#F87171' }}>
            {positive ? '+' : ''}
            {r.scoreDelta}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ReactionChip reaction={r.reaction} />
          {comeback && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-gold">
              <LifebuoyIcon weight="duotone" className="h-3 w-3" /> The comeback
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-6 pb-6">
        <p className="text-[13px] leading-relaxed text-ink-muted">{turn.question}</p>
        <blockquote className="mt-4 border-l-2 pl-4 text-[15px] leading-relaxed text-ink" style={{ borderColor: p.color }}>
          <Highlighted text={attempt.answer} quote={r.evidenceQuote} color={positive ? '#22C55E' : '#F87171'} />
        </blockquote>
        {r.feedback && <p className="mt-4 text-sm leading-relaxed text-ink-muted">{r.feedback}</p>}
        <div className="mt-auto pt-5">{audioUrl ? <AudioPlayer url={audioUrl} color={p.color} /> : <p className="text-[11px] text-ink-faint">Typed answer · answer by voice to replay it here</p>}</div>
      </div>
    </motion.article>
  )
}

function Highlighted({ text, quote, color }: { text: string; quote: string; color: string }) {
  const clean = quote.replace(/…$/, '')
  const idx = clean ? text.toLowerCase().indexOf(clean.toLowerCase()) : -1
  const clip = (s: string, max: number, fromEnd = false) => (s.length > max ? (fromEnd ? `…${s.slice(-max)}` : `${s.slice(0, max)}…`) : s)
  if (idx < 0) return <>{clip(text, 320)}</>
  return (
    <>
      {clip(text.slice(0, idx), 110, true)}
      <mark className="rounded px-0.5 text-ink" style={{ background: `${color}33` }}>
        {text.slice(idx, idx + clean.length)}
      </mark>
      {clip(text.slice(idx + clean.length), 140)}
    </>
  )
}

function AudioPlayer({ url, color }: { url: string; color: string }) {
  const el = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [t, setT] = useState(0)
  useEffect(() => {
    const a = new Audio(url)
    el.current = a
    a.ontimeupdate = () => setT(a.duration ? a.currentTime / a.duration : 0)
    a.onended = () => {
      setPlaying(false)
      setT(0)
    }
    return () => a.pause()
  }, [url])
  return (
    <button
      type="button"
      onClick={() => {
        const a = el.current
        if (!a) return
        if (playing) a.pause()
        else void a.play()
        setPlaying(!playing)
      }}
      className="flex w-full items-center gap-3 rounded-xl bg-black/30 px-3 py-2.5 ring-1 ring-white/10"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: color, color: '#0b0e1f' }}>
        {playing ? <PauseIcon weight="fill" className="h-3.5 w-3.5 fill-current" /> : <PlayIcon weight="fill" className="h-3.5 w-3.5 fill-current" />}
      </span>
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
        <span className="block h-full rounded-full" style={{ width: `${t * 100}%`, background: color }} />
      </span>
      <span className="text-xs text-ink-muted">Your voice</span>
    </button>
  )
}
