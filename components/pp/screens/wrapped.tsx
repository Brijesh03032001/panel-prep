"use client"

import { ArrowLeftIcon, DownloadSimpleIcon, LifebuoyIcon, PlusIcon, ShareNetworkIcon, TrashIcon } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { VERDICTS } from '@/lib/catalog'
import { usePanel } from '@/lib/store'
import type { SessionDoc } from '@/lib/types'
import { Journey } from '../journey'
import { Avatar, Kicker, Logo } from '../primitives'

export function WrappedScreen() {
  const { session, history } = usePanel()
  const go = usePanel(s => s.go)
  const reset = usePanel(s => s.reset)
  const loadHistory = usePanel(s => s.loadHistory)
  const card = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const complete = session?.outcome ? session : null

  const exportPng = async (share: boolean) => {
    if (!card.current) return
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(card.current, { pixelRatio: 2, cacheBust: true })
      if (share && typeof navigator.share === 'function') {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], 'panel-prep-wrapped.png', { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My Panel Prep Wrapped' })
          return
        }
      }
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'panel-prep-wrapped.png'
      a.click()
    } catch {
      // Share sheet dismissed or export blocked; nothing to recover.
    } finally {
      setExporting(false)
    }
  }

  const clearHistory = async () => {
    await api.deleteAll().catch(() => undefined)
    reset()
  }

  return (
    <motion.div className="relative min-h-screen bg-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_25%_30%,rgba(140,29,64,0.28),transparent_70%),radial-gradient(ellipse_40%_50%_at_80%_70%,rgba(255,198,39,0.1),transparent_70%)]" />
      <div className="relative z-10 mx-auto max-w-[1240px] px-6 pb-16 lg:px-10">
        <header className="flex h-16 items-center justify-between">
          <button type="button" onClick={reset} aria-label="Back to start">
            <Logo size="sm" />
          </button>
          <div className="flex items-center gap-2">
            {complete && (
              <button type="button" onClick={() => go('verdict')} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm text-ink-muted ring-1 ring-white/15 transition hover:text-ink">
                <ArrowLeftIcon weight="bold" className="h-4 w-4" /> Verdict
              </button>
            )}
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm text-ink ring-1 ring-white/15 transition hover:ring-white/30">
              <PlusIcon weight="bold" className="h-4 w-4" /> New session
            </button>
          </div>
        </header>

        <div className={complete ? 'mt-8 grid items-start gap-10 lg:grid-cols-[400px_1fr]' : 'mt-8'}>
          {complete && (
            <div className="flex flex-col items-center gap-5 lg:sticky lg:top-8">
              <WrappedCard session={complete} innerRef={card} />
              <div className="flex gap-2.5">
                <button type="button" onClick={() => void exportPng(true)} disabled={exporting} className="gold-btn inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
                  <ShareNetworkIcon weight="duotone" className="h-4 w-4" /> Share
                </button>
                <button type="button" onClick={() => void exportPng(false)} disabled={exporting} className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium ring-1 ring-white/15 transition hover:ring-white/30">
                  <DownloadSimpleIcon weight="bold" className="h-4 w-4" /> Save PNG
                </button>
              </div>
            </div>
          )}

          <div>
            {!complete && (
              <div className="mb-8">
                <Kicker className="text-gold">Your readiness journey</Kicker>
                <h1 className="font-display mt-3 text-[clamp(30px,3.4vw,44px)] font-semibold">Every session, one step closer to ready.</h1>
              </div>
            )}
            {history ? <Journey history={history} currentId={complete?.id} /> : <div className="glass h-72 animate-pulse rounded-[24px]" />}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-faint">
              <p>Sessions are stored only in this app&apos;s own database. Nothing is shared with employers or instructors.</p>
              <button type="button" onClick={() => void clearHistory()} className="inline-flex items-center gap-1.5 transition hover:text-bad">
                <TrashIcon weight="duotone" className="h-3.5 w-3.5" /> Delete all my sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function WrappedCard({ session, innerRef }: { session: SessionDoc; innerRef: React.RefObject<HTMLDivElement | null> }) {
  const o = session.outcome!
  const s = o.stats
  const meta = VERDICTS[o.verdict.label]
  const toughest = session.panel.find(p => p.id === s.toughestCritic)
  const gain = s.comeback ?? s.biggestGain
  const gainWho = gain ? session.panel.find(p => p.id === gain.interviewerId) : null
  const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div
      ref={innerRef}
      className="relative flex aspect-[9/16] w-[min(380px,calc(100vw-48px))] flex-col overflow-hidden rounded-[34px] p-7 text-ink shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]"
      style={{ background: 'linear-gradient(160deg, #8C1D40 0%, #3a1033 28%, #141833 62%, #0b0e1f 100%)' }}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } } }}
    >
      <div className="pointer-events-none absolute -right-20 bottom-10 h-64 w-64 rounded-full blur-3xl" style={{ background: `${meta.color}40` }} />
      <div className="pointer-events-none absolute -left-10 top-24 h-40 w-40 rounded-full bg-[#A78BFA]/20 blur-3xl" />

      <motion.div variants={item} className="relative flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">Panel Prep Wrapped</span>
        <span className="text-[11px] text-white/60">{new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
      </motion.div>
      <motion.p variants={item} className="relative mt-1 text-xs text-white/60">
        {session.setup.roleTitle} · {session.setup.level}
      </motion.p>

      <motion.div variants={item} className="relative mt-9">
        <p className="text-sm text-white/75">{s.linesDefended > 0 || s.linesPartial === 0 ? 'You defended' : 'You partly defended'}</p>
        <p className="font-display mt-1 text-[68px] font-bold leading-[0.95] tnum">
          {s.linesDefended > 0 || s.linesPartial === 0 ? s.linesDefended : s.linesPartial}
          <span className="text-white/40"> of {s.linesTested}</span>
        </p>
        <p className="mt-1 text-sm text-white/75">resume lines your panel tested</p>
      </motion.div>

      <motion.div variants={item} className="relative mt-8 grid grid-cols-2 gap-2.5">
        {toughest && (
          <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-wider text-white/55">Toughest critic</p>
            <div className="mt-2 flex items-center gap-2">
              <Avatar seat={toughest.seat} size={28} ring={toughest.color} />
              <p className="font-display text-sm font-semibold">{toughest.name.split(' ')[0]}</p>
            </div>
          </div>
        )}
        {gain && (
          <div className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-wider text-white/55">{s.comeback ? 'Biggest comeback' : 'Biggest win'}</p>
            <p className="font-display mt-1.5 flex items-center gap-1.5 text-2xl font-bold text-good tnum">
              +{gain.delta}
              {s.comeback && <LifebuoyIcon weight="duotone" className="h-4 w-4 text-gold" />}
            </p>
            {gainWho && <p className="text-[10px] text-white/55">with {gainWho.name.split(' ')[0]}</p>}
          </div>
        )}
        {s.strongestDomain && (
          <div className="col-span-2 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-wider text-white/55">Strongest domain</p>
            <p className="font-display mt-1 text-lg font-semibold">{s.strongestDomain}</p>
          </div>
        )}
      </motion.div>

      <motion.div variants={item} className="relative mt-auto">
        <div className="flex items-center justify-between rounded-2xl px-4 py-3.5" style={{ background: `${meta.color}1f`, boxShadow: `inset 0 0 0 1px ${meta.color}55` }}>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/60">Verdict</p>
            <p className="font-display text-xl font-semibold" style={{ color: meta.color }}>
              {o.verdict.label}
            </p>
          </div>
          <p className="font-display text-3xl font-bold tnum">{o.verdict.overall}%</p>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div className="flex -space-x-2">
            {session.panel.map(p => (
              <Avatar key={p.id} seat={p.seat} size={26} ring="#0b0e1f" />
            ))}
          </div>
          <p className="text-[11px] font-medium text-white/60">Know your own work.</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
