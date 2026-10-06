"use client"

import {
  ArrowDownIcon,
  ArrowRightIcon,
  CaretDownIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  EyeSlashIcon,
  FileArrowUpIcon,
  FilePdfIcon,
  LifebuoyIcon,
  LockKeyIcon,
  MapTrifoldIcon,
  MicrophoneIcon,
  PlayIcon,
  ShieldCheckIcon,
  SparkleIcon,
  TextAlignLeftIcon,
  TrophyIcon,
  UsersThreeIcon,
  XIcon,
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { LEVELS, ROLES } from '@/lib/catalog'
import { usePanel } from '@/lib/store'
import { PanelPreview } from '../panel-preview'
import { Kicker, Logo, RoleIcon, cx } from '../primitives'

const STEPS = [
  { icon: FileArrowUpIcon, color: '#A78BFA', title: 'Drop in your resume', text: 'It is split into claims, and your contact details are removed before any AI reads it.' },
  { icon: UsersThreeIcon, color: '#2DD4BF', title: 'Meet a panel built for you', text: 'Three interviewers, chosen from the gaps in your resume and the role you want.' },
  { icon: MicrophoneIcon, color: '#FB923C', title: 'Defend every line, out loud', text: 'Answer by voice or text. Each resume line turns green, yellow or red as it is tested.' },
  { icon: TrophyIcon, color: '#FFC627', title: 'Leave with a plan', text: 'A verdict, a highlight reel, 60-second drills and a coaching report to keep.' },
]

const PROOF = [
  { n: '11', label: 'interviewer specialties' },
  { n: '3', label: 'interviewers, built from your gaps' },
  { n: '1', label: 'Lifeline: a hint, never the answer' },
  { n: '0', label: 'employers who ever see it' },
]

export function HomeScreen() {
  const { config, busy, history } = usePanel()
  const startDemo = usePanel(s => s.startDemo)
  const startLive = usePanel(s => s.startLive)
  const loadHistory = usePanel(s => s.loadHistory)
  const go = usePanel(s => s.go)
  const [tab, setTab] = useState<'upload' | 'paste'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [pasted, setPasted] = useState('')
  const [role, setRole] = useState<string>('frontend')
  const [customRole, setCustomRole] = useState('')
  const [level, setLevel] = useState<string>('Internship')
  const [jdOpen, setJdOpen] = useState(false)
  const [jd, setJd] = useState('')
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLElement>(null)

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const hasResume = tab === 'upload' ? Boolean(file) : pasted.trim().length > 80
  const hasRole = role !== 'custom' || customRole.trim().length > 1
  const live = Boolean(config?.live)
  const ready = live && hasResume && hasRole && !busy
  const pastSessions = (history ?? []).filter(s => !s.sample)

  const submit = () => {
    if (!ready) return
    const form = new FormData()
    if (tab === 'upload' && file) form.append('file', file)
    if (tab === 'paste') form.append('text', pasted)
    form.append('roleKey', role)
    if (role === 'custom') form.append('roleTitle', customRole)
    form.append('level', level)
    if (jd.trim()) form.append('jobDescription', jd)
    void startLive(form)
  }

  const takeFile = (f: File | undefined | null) => {
    if (f && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))) setFile(f)
  }

  const toForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <motion.div className="relative min-h-screen overflow-x-clip bg-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1000px] bg-[radial-gradient(ellipse_45%_55%_at_12%_8%,rgba(140,29,64,0.42),transparent_70%),radial-gradient(ellipse_40%_50%_at_88%_35%,rgba(255,198,39,0.09),transparent_70%)]" />
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[1000px] opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_15%,black,transparent)]" />

      <div className="relative z-10 mx-auto max-w-[1320px] px-6 lg:px-10">
        <header className="flex h-20 items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#how" className="hidden rounded-full px-3 py-1.5 text-sm text-ink-muted transition hover:text-ink md:inline">
              How it works
            </a>
            {pastSessions.length > 0 && (
              <button type="button" onClick={() => go('wrapped')} className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-muted transition hover:text-ink sm:inline-flex">
                <ChartLineUpIcon weight="duotone" className="h-4 w-4" /> Your journey
              </button>
            )}
            <button type="button" onClick={toForm} className="rounded-full bg-white/[0.07] px-4 py-2 text-sm font-medium ring-1 ring-white/15 transition hover:bg-white/[0.11]">
              Start practicing
            </button>
          </nav>
        </header>

        <section className="grid items-center gap-14 pb-14 pt-4 lg:min-h-[calc(100vh-80px)] lg:grid-cols-[0.95fr_1.1fr] lg:pb-20">
          <div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] py-1 pl-1.5 pr-3.5 text-[13px] text-ink-muted ring-1 ring-white/10">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <SparkleIcon weight="duotone" className="h-3.5 w-3.5" />
                </span>
                A flight simulator for job interviews
              </span>
              <h1 className="font-display mt-6 text-[clamp(42px,5.2vw,74px)] font-semibold leading-[1.0]">
                Know your own work before someone <span className="text-gradient-gold">asks you about it.</span>
              </h1>
              <p className="mt-6 max-w-[540px] text-[18px] leading-relaxed text-ink-muted">
                Three expert interviewers read your resume, find the lines you cannot back up yet, and question you out loud. A coach helps you learn. You leave knowing
                exactly what you can defend.
              </p>
            </motion.div>

            <motion.div className="mt-9 flex flex-wrap items-center gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <button type="button" onClick={toForm} className="gold-btn inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-[15px] font-semibold">
                Build my panel <ArrowRightIcon weight="bold" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void startDemo()}
                disabled={Boolean(busy)}
                className="group inline-flex items-center gap-3 rounded-2xl bg-white/[0.06] py-2 pl-2 pr-5 ring-1 ring-white/15 transition hover:bg-white/10 disabled:opacity-60"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stage transition group-hover:scale-105">
                  <PlayIcon weight="fill" className="h-4 w-4" />
                </span>
                <span className="text-left">
                  <span className="block text-sm font-semibold">Watch Maya&apos;s session</span>
                  <span className="block text-xs text-ink-muted">Sample resume · 3 minutes</span>
                </span>
              </button>
            </motion.div>

            <motion.ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5 text-[13px] text-ink-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
              <li className="inline-flex items-center gap-2">
                <LockKeyIcon weight="duotone" className="h-[18px] w-[18px] text-good" /> Contact details removed first
              </li>
              <li className="inline-flex items-center gap-2">
                <ShieldCheckIcon weight="duotone" className="h-[18px] w-[18px] text-[#2DD4BF]" /> Runs on ASU CreateAI
              </li>
              <li className="inline-flex items-center gap-2">
                <EyeSlashIcon weight="duotone" className="h-[18px] w-[18px] text-[#A78BFA]" /> Never shared with employers
              </li>
            </motion.ul>
          </div>

          <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 90, damping: 18 }}>
            <PanelPreview />
          </motion.div>
        </section>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-line ring-1 ring-line md:grid-cols-4">
          {PROOF.map(p => (
            <div key={p.label} className="bg-[#0f1229] px-6 py-5">
              <p className="font-display text-[34px] font-semibold leading-none text-gradient-gold">{p.n}</p>
              <p className="mt-2 text-sm text-ink-muted">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

      <section id="how" className="relative z-10 mx-auto max-w-[1320px] scroll-mt-6 px-6 pb-8 pt-24 lg:px-10">
        <div className="text-center">
          <Kicker className="text-gold">How it works</Kicker>
          <h2 className="font-display mt-3 text-[clamp(28px,3.2vw,42px)] font-semibold">From resume to ready in four steps.</h2>
        </div>
        <motion.ol
          className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        >
          {STEPS.map((s, i) => (
            <motion.li key={s.title} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }} className="glass relative rounded-[24px] p-6">
              <div className="flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `${s.color}1c`, color: s.color }}>
                  <s.icon weight="duotone" className="h-8 w-8" />
                </span>
                <span className="font-mono text-[12px] text-ink-faint">0{i + 1}</span>
              </div>
              <p className="font-display mt-5 text-[18px] font-semibold">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{s.text}</p>
              {i < STEPS.length - 1 && (
                <span className="absolute -right-[15px] top-[52px] z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-stage text-ink-faint ring-1 ring-white/10 lg:flex">
                  <ArrowRightIcon weight="bold" className="h-3.5 w-3.5" />
                </span>
              )}
            </motion.li>
          ))}
        </motion.ol>
      </section>

      <section ref={formRef} id="start" className="relative z-10 scroll-mt-0 overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('/preboardroom.png')" }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b0e1f] via-[#0b0e1f]/75 to-[#0b0e1f]" />
        <div className="relative mx-auto grid max-w-[1320px] items-start gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div className="lg:sticky lg:top-12 lg:pt-6">
            <Kicker className="text-gold">Your turn</Kicker>
            <h2 className="font-display mt-3 text-[clamp(30px,3.4vw,46px)] font-semibold leading-[1.05]">Build your panel in under a minute.</h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-muted">Two students applying for the same job can face different panels. Yours is built from your own resume.</p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: UsersThreeIcon, color: '#A78BFA', title: 'A panel built for you', text: 'Domain experts who join because of a specific line on your resume.' },
                { icon: MapTrifoldIcon, color: '#2DD4BF', title: 'A live Defensibility Map', text: 'See which lines you can back up, as you answer.' },
                { icon: LifebuoyIcon, color: '#FFC627', title: 'Tough panel, friendly coach', text: 'Sam offers one Lifeline per interview: a hint, never the answer.' },
                { icon: FilePdfIcon, color: '#FB923C', title: 'A report you will actually read', text: 'Two pages: your verdict, your wins, and three things to practice.' },
              ].map(f => (
                <li key={f.title} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${f.color}1c`, color: f.color }}>
                    <f.icon weight="duotone" className="h-[22px] w-[22px]" />
                  </span>
                  <div>
                    <p className="font-medium">{f.title}</p>
                    <p className="text-sm text-ink-muted">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="glass relative rounded-[28px] p-6 lg:p-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">Build your panel</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">About 15 min</span>
            </div>

            <Step n={1} title="Your resume">
              <div className="mb-3 inline-flex rounded-xl bg-black/30 p-1 text-xs">
                {(['upload', 'paste'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cx('flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition', tab === t ? 'bg-white/10 text-ink' : 'text-ink-muted hover:text-ink')}
                  >
                    {t === 'upload' ? <FileArrowUpIcon weight="duotone" className="h-4 w-4" /> : <TextAlignLeftIcon weight="duotone" className="h-4 w-4" />}
                    {t === 'upload' ? 'Upload PDF' : 'Paste text'}
                  </button>
                ))}
              </div>
              {tab === 'upload' ? (
                <div
                  onDragOver={e => {
                    e.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragging(false)
                    takeFile(e.dataTransfer.files[0])
                  }}
                  onClick={() => input.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && input.current?.click()}
                  className={cx(
                    'flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed px-4 py-5 transition',
                    dragging ? 'border-gold bg-gold/8' : file ? 'border-good/40 bg-good/[0.06]' : 'border-white/15 hover:border-white/30 hover:bg-white/[0.03]',
                  )}
                >
                  <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={e => takeFile(e.target.files?.[0])} />
                  <span className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', file ? 'bg-good/15 text-good' : 'bg-white/8 text-ink-muted')}>
                    {file ? <ClipboardTextIcon weight="duotone" className="h-6 w-6" /> : <FileArrowUpIcon weight="duotone" className="h-6 w-6" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file ? file.name : 'Drop your resume PDF here'}</p>
                    <p className="text-xs text-ink-faint">{file ? `${Math.round(file.size / 1024)} KB · ready` : 'or click to browse · up to 8 MB'}</p>
                  </div>
                  {file && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                      aria-label="Remove file"
                      className="rounded-lg p-1.5 text-ink-faint hover:text-ink"
                    >
                      <XIcon weight="bold" className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <textarea
                  value={pasted}
                  onChange={e => setPasted(e.target.value)}
                  rows={5}
                  placeholder="Paste your resume text here…"
                  className="scrollbar-thin w-full resize-none rounded-2xl bg-black/30 px-4 py-3 text-sm ring-1 ring-white/10 placeholder:text-ink-faint focus:outline-none focus:ring-gold/50"
                />
              )}
            </Step>

            <Step n={2} title="The role you want">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ROLES.map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    aria-pressed={role === r.key}
                    className={cx(
                      'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition',
                      role === r.key ? 'bg-gold/12 ring-1 ring-gold/50' : 'bg-white/[0.04] ring-1 ring-white/8 hover:bg-white/[0.07]',
                    )}
                  >
                    <RoleIcon icon={r.icon} className={cx('h-[18px] w-[18px] shrink-0', role === r.key ? 'text-gold' : 'text-ink-muted')} />
                    <span className="block truncate text-[13px] font-medium leading-tight" title={r.title}>
                      {r.short}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRole('custom')}
                  aria-pressed={role === 'custom'}
                  className={cx('rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition', role === 'custom' ? 'bg-gold/12 ring-1 ring-gold/50' : 'bg-white/[0.04] text-ink-muted ring-1 ring-white/8 hover:bg-white/[0.07]')}
                >
                  Something else…
                </button>
              </div>
              {role === 'custom' && (
                <input
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="e.g. Research Assistant, Game Developer"
                  className="mt-2 w-full rounded-xl bg-black/30 px-3.5 py-2.5 text-sm ring-1 ring-white/10 placeholder:text-ink-faint focus:outline-none focus:ring-gold/50"
                />
              )}
            </Step>

            <Step n={3} title="Your level">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-xl bg-black/30 p-1 text-xs">
                  {LEVELS.map(l => (
                    <button key={l} type="button" onClick={() => setLevel(l)} className={cx('rounded-lg px-3.5 py-1.5 font-medium transition', level === l ? 'bg-white/10 text-ink' : 'text-ink-muted hover:text-ink')}>
                      {l}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setJdOpen(!jdOpen)} className="ml-auto inline-flex items-center gap-1 text-xs text-ink-muted transition hover:text-ink" aria-expanded={jdOpen}>
                  Paste a job posting <CaretDownIcon weight="bold" className={cx('h-3.5 w-3.5 transition', jdOpen && 'rotate-180')} />
                </button>
              </div>
              <AnimatePresence>
                {jdOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <textarea
                      value={jd}
                      onChange={e => setJd(e.target.value)}
                      rows={3}
                      placeholder="Optional: paste a real job description to tune the panel to that employer."
                      className="scrollbar-thin mt-2.5 w-full resize-none rounded-xl bg-black/30 px-3.5 py-2.5 text-sm ring-1 ring-white/10 placeholder:text-ink-faint focus:outline-none focus:ring-gold/50"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Step>

            <button type="button" onClick={submit} disabled={!ready} className="gold-btn mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-semibold">
              {live ? (
                <>
                  Build my panel <ArrowRightIcon weight="bold" className="h-4 w-4" />
                </>
              ) : (
                <>
                  <LockKeyIcon weight="duotone" className="h-4 w-4" /> Live mode needs an ASU CreateAI token
                </>
              )}
            </button>
            <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-faint">
              <ShieldCheckIcon weight="duotone" className="mt-px h-4 w-4 shrink-0 text-good/80" />
              {live
                ? `Contact details are removed before ${config?.provider ?? 'the AI'} reads your resume. Sessions stay in this app's own database and you can delete them anytime. Practice signals only, never shared with employers.`
                : 'No AI key is configured, so live sessions are off. The demo replays a recorded session through the real engine.'}
            </p>
            {!live && (
              <button type="button" onClick={() => void startDemo()} disabled={Boolean(busy)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold transition hover:opacity-80">
                <PlayIcon weight="fill" className="h-3.5 w-3.5" /> Watch Maya&apos;s session instead
              </button>
            )}
          </motion.div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-6 text-xs text-ink-faint lg:px-10">
        <p>Panel Prep · ASU EdPlus · prHACKtical 2026</p>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-flex items-center gap-1.5 transition hover:text-ink">
          <ArrowDownIcon weight="bold" className="h-3.5 w-3.5 rotate-180" /> Back to top
        </button>
      </footer>
    </motion.div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 font-mono text-[10px] font-semibold text-gold">{n}</span>
        <p className="text-sm font-medium">{title}</p>
      </div>
      {children}
    </div>
  )
}
