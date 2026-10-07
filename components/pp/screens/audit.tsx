"use client"

import { ArrowRightIcon, CheckCircleIcon, CheckIcon, CircleHalfIcon, CircleNotchIcon, FileTextIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { DOMAINS, domainLabel } from '@/lib/catalog'
import { usePanel } from '@/lib/store'
import type { LineFlag, ResumeEntry, ResumeLine } from '@/lib/types'
import { BackButton, DomainIcon, Kicker, Logo, cx } from '../primitives'

const SWEEP_MS = 2600
const FLAG = {
  strength: { label: 'Strength', color: '#22C55E', icon: CheckCircleIcon },
  gap: { label: 'Needs the how', color: '#F59E0B', icon: CircleHalfIcon },
  shaky: { label: 'Sounds shaky', color: '#F87171', icon: WarningCircleIcon },
} as const

export function AuditScreen() {
  const { session, error } = usePanel()
  const go = usePanel(s => s.go)
  const back = usePanel(s => s.back)
  const buildPanel = usePanel(s => s.buildPanel)
  const [swept, setSwept] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSwept(true), SWEEP_MS + 400)
    return () => clearTimeout(t)
  }, [])

  const lines = useMemo(() => session?.resume.lines ?? [], [session])
  const counts = useMemo(() => {
    const c: Record<LineFlag, number> = { strength: 0, gap: 0, shaky: 0 }
    lines.forEach(l => l.flag && c[l.flag]++)
    return c
  }, [lines])

  if (!session) return null
  const panelReady = session.panel.length > 0
  const ready = panelReady && swept
  const sections = groupResume(lines)
  const toProve = counts.gap + counts.shaky

  const steps = [
    { label: `Read your resume and found ${lines.length} claims an interviewer could ask about`, done: true },
    { label: swept ? `Marked ${toProve} ${toProve === 1 ? 'claim' : 'claims'} that need more proof behind ${toProve === 1 ? 'it' : 'them'}` : 'Checking which claims need more proof', done: swept },
    {
      label: panelReady
        ? `Picked your interviewers: ${session.panel.map(p => domainLabel(p.domain)).join(', ')}`
        : `Picking 3 interviewers out of ${DOMAINS.length} specialties for this role`,
      done: panelReady,
    },
    { label: ready ? 'Your panel has read your resume and is ready' : 'Getting your panel ready', done: ready },
  ]

  return (
    <motion.div className="grid-bg relative min-h-screen overflow-hidden bg-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pointer-events-none absolute left-[20%] top-[-10%] h-[520px] w-[520px] rounded-full bg-[#A78BFA]/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[10%] h-[520px] w-[520px] rounded-full bg-gold/8 blur-[120px]" />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1320px] gap-10 px-6 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <BackButton onClick={back} label="Home" />
            <Logo size="sm" />
          </div>
          <div className="my-auto py-10">
            <Kicker className="text-gold/80">Step 1 · Resume check</Kicker>
            <h1 className="font-display mt-3 text-[clamp(30px,3vw,42px)] font-semibold leading-tight">Reading your resume the way an interviewer would.</h1>
            <AnimatePresence>
              {swept && session.resume.headline && (
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-[16px] leading-relaxed text-ink-muted">
                  {session.resume.headline}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-7 grid grid-cols-3 gap-3">
              {(Object.keys(FLAG) as LineFlag[]).map((f, i) => {
                const meta = FLAG[f]
                return (
                  <motion.div
                    key={f}
                    className="glass-soft rounded-2xl px-4 py-3.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: swept ? 1 : 0.35, y: 0 }}
                    transition={{ delay: swept ? i * 0.12 : 0 }}
                  >
                    <meta.icon weight="duotone" className="h-4 w-4" style={{ color: meta.color }} />
                    <p className="font-display mt-2 text-3xl font-semibold tnum">{swept ? counts[f] : '–'}</p>
                    <p className="text-xs text-ink-muted">{meta.label}</p>
                  </motion.div>
                )
              })}
            </div>

            {swept && session.resume.missing.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-5">
                <p className="text-xs text-ink-faint">The role also expects, but your resume never mentions:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {session.resume.missing.map(m => (
                    <span key={m.skill} title={m.why} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-ink ring-1 ring-white/10">
                      {m.skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            <ul className="mt-8 space-y-2.5">
              {steps.map((s, i) => (
                <li key={i} className={cx('flex items-center gap-3 text-sm transition', s.done ? 'text-ink' : 'text-ink-faint')}>
                  <span className={cx('flex h-5 w-5 items-center justify-center rounded-full', s.done ? 'bg-good/15 text-good' : 'bg-white/5')}>
                    {s.done ? <CheckIcon weight="bold" className="h-3 w-3" /> : <CircleNotchIcon weight="bold" className="h-3 w-3 animate-spin" />}
                  </span>
                  {s.label}
                </li>
              ))}
            </ul>

            {panelReady && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex gap-2">
                {session.panel.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs" style={{ background: `${p.color}1a`, color: p.color }}>
                    <DomainIcon domain={p.domain} className="h-3.5 w-3.5" /> {domainLabel(p.domain)}
                  </span>
                ))}
              </motion.div>
            )}

            <div className="mt-8 flex items-center gap-4">
              <button
                type="button"
                onClick={() => go('assemble')}
                disabled={!ready}
                className="gold-btn inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-[15px] font-semibold"
              >
                Meet your panel <ArrowRightIcon weight="bold" className="h-4.5 w-4.5" />
              </button>
              {error && !panelReady && (
                <button type="button" onClick={() => void buildPanel()} className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                  Retry building the panel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative my-auto">
          <div className="glass relative overflow-hidden rounded-[26px]">
            <div className="flex items-center justify-between border-b border-line px-6 py-3">
              <p className="flex min-w-0 items-center gap-2 text-xs text-ink-muted">
                <FileTextIcon weight="duotone" className="h-4 w-4 shrink-0 text-ink-faint" />
                <span className="truncate">{session.setup.sourceName ?? 'Pasted resume'}</span>
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{lines.length} claims found</span>
            </div>
            <div className="px-7 pb-7 pt-6">
              <div className="text-center">
                <p className="font-display text-[22px] font-semibold tracking-[0.04em]">{session.resume.title ?? 'Your resume'}</p>
                <p className="mt-0.5 text-[11.5px] italic text-ink-faint">Email, phone and links removed before analysis</p>
              </div>
              <div className="mt-5 space-y-5">
                {sections.map(sec => (
                  <section key={sec.name}>
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-gold/90">{sec.name}</h3>
                      <span className="h-px flex-1 bg-white/12" />
                    </div>
                    <div className="mt-2 space-y-2.5">
                      {sec.entries.map((en, k) => (
                        <div key={k}>
                          {en.entry && <EntryHeader entry={en.entry} />}
                          <ul className={cx('space-y-0.5', en.entry && 'mt-1')}>
                            {en.lines.map(l => (
                              <ResumeRow key={l.id} line={l} at={(lines.indexOf(l) / Math.max(1, lines.length)) * SWEEP_MS} bullet={Boolean(en.entry) && sec.name !== 'Education'} />
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 h-full"
              initial={{ y: '-30%' }}
              animate={{ y: '110%' }}
              transition={{ duration: SWEEP_MS / 1000, ease: 'linear' }}
            >
              <div className="h-28 bg-gradient-to-b from-transparent via-gold/14 to-transparent" />
              <div className="-mt-14 h-px bg-gold/70 shadow-[0_0_24px_4px_rgba(255,198,39,0.45)]" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Sections, then the projects, jobs or schools inside them, in the order the resume wrote them.
function groupResume(lines: ResumeLine[]) {
  const sections: { name: string; entries: { entry: ResumeEntry | null; lines: ResumeLine[] }[] }[] = []
  for (const l of lines) {
    let sec = sections[sections.length - 1]
    if (sec?.name !== l.section) {
      sec = { name: l.section, entries: [] }
      sections.push(sec)
    }
    const last = sec.entries[sec.entries.length - 1]
    if (last && (last.entry?.title ?? null) === (l.entry?.title ?? null)) last.lines.push(l)
    else sec.entries.push({ entry: l.entry ?? null, lines: [l] })
  }
  return sections
}

function EntryHeader({ entry }: { entry: ResumeEntry }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-2.5">
      <p className="min-w-0 text-[14px] leading-snug">
        <span className="font-semibold text-ink">{entry.title}</span>
        {entry.detail && <span className="text-ink-muted"> · {entry.detail}</span>}
      </p>
      {entry.date && <span className="shrink-0 font-mono text-[10.5px] text-ink-faint">{entry.date}</span>}
    </div>
  )
}

function ResumeRow({ line, at, bullet }: { line: ResumeLine; at: number; bullet: boolean }) {
  const meta = line.flag ? FLAG[line.flag] : null
  const colon = line.section === 'Skills' ? line.text.indexOf(':') : -1
  return (
    <motion.li
      className="relative flex items-start gap-2.5 rounded-lg px-2.5 py-1"
      initial={{ opacity: 0.25 }}
      animate={{
        opacity: 1,
        backgroundColor: meta ? [`${meta.color}00`, `${meta.color}38`, `${meta.color}12`] : 'rgba(0,0,0,0)',
      }}
      transition={{ delay: at / 1000, duration: meta ? 1.1 : 0.3 }}
    >
      {bullet && <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta ? meta.color : 'rgba(255,255,255,0.35)' }} />}
      {!bullet && meta && <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />}
      <span className="flex-1 text-[13.5px] leading-snug text-ink/90">
        {colon > 0 ? (
          <>
            <span className="font-semibold text-ink">{line.text.slice(0, colon + 1)}</span>
            {line.text.slice(colon + 1)}
          </>
        ) : (
          line.text
        )}
      </span>
      {meta && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: at / 1000 + 0.2 }}
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ background: `${meta.color}1f`, color: meta.color }}
          title={line.flagNote ?? undefined}
        >
          {meta.label}
        </motion.span>
      )}
    </motion.li>
  )
}
