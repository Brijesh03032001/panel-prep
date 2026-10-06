"use client"

import { BellIcon, BellSlashIcon, FlagIcon, MapTrifoldIcon, SpeakerHighIcon, SpeakerSlashIcon } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { usePanel } from '@/lib/store'
import { Logo, cx } from './primitives'

export function TopBar({ showProgress = true }: { showProgress?: boolean }) {
  const { session, turn, prefs, stage } = usePanel()
  const setPref = usePanel(s => s.setPref)
  const wrapUp = usePanel(s => s.wrapUp)
  const reset = usePanel(s => s.reset)
  if (!session) return null
  const answered = session.turns.filter(t => t.attempts.length > 0)
  const slots = Math.max(session.config.maxTurns, answered.length + (turn && !turn.attempts.length ? 1 : 0))
  return (
    <header className="relative z-40 flex h-16 items-center gap-4 px-5">
      <button type="button" onClick={reset} aria-label="Back to start" className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
        <Logo size="sm" />
      </button>
      <div className="hidden items-center gap-2 md:flex">
        <span className="glass-soft rounded-full px-3 py-1 text-xs text-ink-muted">
          {session.kind === 'rematch' ? 'Rematch · ' : ''}
          {session.setup.roleTitle} · {session.setup.level}
        </span>
        {session.mode === 'demo' && (
          <span className="rounded-full bg-gold/12 px-3 py-1 text-xs font-medium text-gold ring-1 ring-gold/25">Demo · sample resume</span>
        )}
      </div>

      {showProgress && (
        <div className="mx-auto flex items-center gap-1.5" aria-label={`Question ${Math.min(answered.length + 1, slots)} of ${slots}`}>
          {Array.from({ length: slots }).map((_, i) => {
            const t = session.turns[i]
            const who = t ? session.panel.find(p => p.id === t.interviewerId) : null
            const done = t && t.attempts.length > 0 && (session.current?.turnId !== t.id)
            const current = t && t.id === turn?.id && !done
            return (
              <motion.span
                key={i}
                className="h-1.5 rounded-full"
                animate={{ width: current ? 28 : 14, opacity: done || current ? 1 : 0.9 }}
                style={{ background: who && (done || current) ? who.color : 'rgba(255,255,255,0.22)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              />
            )
          })}
        </div>
      )}

      <div className={cx('flex items-center gap-1.5', !showProgress && 'ml-auto')}>
        <Toggle on={prefs.voice} onClick={() => setPref('voice', !prefs.voice)} label={prefs.voice ? 'Mute interviewer voices' : 'Turn on interviewer voices'}>
          {prefs.voice ? <SpeakerHighIcon weight="duotone" className="h-4 w-4" /> : <SpeakerSlashIcon weight="duotone" className="h-4 w-4" />}
        </Toggle>
        <Toggle on={prefs.sound} onClick={() => setPref('sound', !prefs.sound)} label={prefs.sound ? 'Mute sound cues' : 'Turn on sound cues'}>
          {prefs.sound ? <BellIcon weight="duotone" className="h-4 w-4" /> : <BellSlashIcon weight="duotone" className="h-4 w-4" />}
        </Toggle>
        <Toggle on={prefs.map} onClick={() => setPref('map', !prefs.map)} label={prefs.map ? 'Hide Defensibility Map' : 'Show Defensibility Map'}>
          <MapTrifoldIcon weight="duotone" className="h-4 w-4" />
        </Toggle>
        {showProgress && (
          <button
            type="button"
            onClick={() => void wrapUp()}
            disabled={stage === 'finishing' || !session.turns.some(t => t.attempts.length > 0)}
            className="ml-1.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-muted ring-1 ring-white/15 transition hover:text-ink hover:ring-white/30 disabled:opacity-40"
          >
            <FlagIcon weight="duotone" className="h-3.5 w-3.5" /> Wrap up
          </button>
        )}
      </div>
    </header>
  )
}

function Toggle({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      title={label}
      className={cx('flex h-9 w-9 items-center justify-center rounded-full transition', on ? 'text-ink hover:bg-white/8' : 'text-ink-faint hover:bg-white/8 hover:text-ink-muted')}
    >
      {children}
    </button>
  )
}
