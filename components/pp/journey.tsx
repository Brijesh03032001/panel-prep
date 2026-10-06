"use client"

import { ArrowDownIcon, ArrowUpIcon, BarbellIcon, ChartLineUpIcon, FlagCheckeredIcon, MountainsIcon, StackIcon, TableIcon, TrophyIcon, type Icon } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { domainLabel, VERDICTS } from '@/lib/catalog'
import type { SessionSummary, VerdictLabel } from '@/lib/types'
import { DomainIcon, Kicker, cx } from './primitives'

const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const READY = 70

const ZONES: { label: VerdictLabel; from: number; to: number; icon: Icon }[] = [
  { label: 'Interview Ready', from: 70, to: 100, icon: TrophyIcon },
  { label: 'Almost There', from: 40, to: 70, icon: MountainsIcon },
  { label: 'Keep Practicing', from: 0, to: 40, icon: BarbellIcon },
]
const zoneOf = (v: number) => ZONES.find(z => v >= z.from) ?? ZONES[ZONES.length - 1]

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function Journey({ history, currentId }: { history: SessionSummary[]; currentId?: string }) {
  const [table, setTable] = useState(false)
  const full = useMemo(() => history.filter(s => s.kind === 'full' && s.overall != null).sort((a, b) => a.createdAt - b.createdAt).slice(-8), [history])
  const domains = useMemo(() => {
    const map = new Map<string, number[]>()
    ;[...history].sort((a, b) => a.createdAt - b.createdAt).forEach(s =>
      s.domains.forEach(d => {
        const arr = map.get(d.domain) ?? []
        arr.push(d.confidence)
        map.set(d.domain, arr)
      }),
    )
    return [...map.entries()]
      .map(([domain, vals]) => ({ domain, first: vals[0], latest: vals[vals.length - 1], count: vals.length }))
      .sort((a, b) => b.latest - a.latest)
      .slice(0, 6)
  }, [history])

  if (full.length === 0)
    return (
      <div className="glass rounded-[24px] p-8 text-center">
        <ChartLineUpIcon weight="duotone" className="mx-auto h-10 w-10 text-gold" />
        <p className="font-display mt-3 text-lg font-semibold">Your journey starts with your first session</p>
        <p className="mt-1 text-sm text-ink-muted">Finish a panel and your readiness shows up here, session by session.</p>
      </div>
    )

  const first = full[0].overall!
  const latest = full[full.length - 1].overall!
  const change = latest - first
  const toReady = READY - latest
  const zone = zoneOf(latest)

  return (
    <div className="space-y-5">
      <div className="glass overflow-hidden rounded-[24px]">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-0">
          <div className="max-w-xl">
            <Kicker className="text-gold">Readiness journey</Kicker>
            <h2 className="font-display mt-2 text-[clamp(22px,2.2vw,28px)] font-semibold leading-tight">
              {full.length === 1 ? (
                <>Your starting line: {latest}% panel confidence</>
              ) : change > 0 ? (
                <>
                  Up <span className="text-good">{change} points</span> in {full.length} sessions
                </>
              ) : change < 0 ? (
                <>
                  Down {Math.abs(change)} points in {full.length} sessions. Every panel is different.
                </>
              ) : (
                <>Holding steady across {full.length} sessions</>
              )}
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">How convinced your whole panel ended up, each session. 70% and above is Interview Ready.</p>
          </div>
          <button
            type="button"
            onClick={() => setTable(!table)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-ink-muted ring-1 ring-white/15 transition hover:text-ink"
            aria-pressed={table}
          >
            {table ? <ChartLineUpIcon weight="duotone" className="h-4 w-4" /> : <TableIcon weight="duotone" className="h-4 w-4" />}
            {table ? 'Chart' : 'Table'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-4">
          <Stat label="Latest" value={`${latest}%`} sub={zone.label} icon={<zone.icon weight="duotone" className="h-4 w-4" />} tint={VERDICTS[zone.label].color} />
          <Stat
            label="Since session 1"
            value={full.length > 1 ? `${change > 0 ? '+' : ''}${change}` : '—'}
            sub={full.length > 1 ? 'points' : 'one session so far'}
            icon={change < 0 ? <ArrowDownIcon weight="bold" className="h-4 w-4" /> : <ArrowUpIcon weight="bold" className="h-4 w-4" />}
            tint={full.length < 2 ? '#a6acc9' : change < 0 ? '#F87171' : '#22C55E'}
          />
          <Stat
            label="To Interview Ready"
            value={toReady > 0 ? `${toReady}` : 'Ready'}
            sub={toReady > 0 ? 'points to go' : `cleared by ${-toReady}`}
            icon={<FlagCheckeredIcon weight="duotone" className="h-4 w-4" />}
            tint="#FFC627"
          />
          <Stat label="Sessions" value={`${full.length}`} sub={full.some(s => s.sample) ? `${full.filter(s => s.sample).length} sample` : 'completed'} icon={<StackIcon weight="duotone" className="h-4 w-4" />} tint="#A78BFA" />
        </div>

        <div className="p-6 pt-5">
          {table ? (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-ink-faint">
                <tr>
                  <th className="pb-2 font-medium">Session</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Verdict</th>
                  <th className="pb-2 text-right font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {full.map((s, i) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="py-2 tnum">
                      {i + 1}
                      {s.sample ? <span className="ml-1.5 text-xs text-ink-faint">sample</span> : ''}
                    </td>
                    <td className="py-2 text-ink-muted">{fmt(s.createdAt)}</td>
                    <td className="py-2">{s.roleTitle}</td>
                    <td className="py-2">{s.verdict}</td>
                    <td className="py-2 text-right tnum">{s.overall}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <OverallChart points={full} currentId={currentId} />
          )}
        </div>
      </div>

      {domains.length > 0 && (
        <div className="glass rounded-[24px] p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Kicker>By skill area</Kicker>
              <h3 className="font-display mt-2 text-xl font-semibold">How convinced each kind of interviewer is</h3>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-muted" aria-hidden>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-[#a6acc9]" /> First time
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Latest
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-px bg-white/40" /> Ready at 70
              </span>
            </div>
          </div>
          <ul className="mt-5 space-y-3.5">
            {domains.map((d, i) => (
              <DomainRow key={d.domain} {...d} index={i} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub, icon, tint }: { label: string; value: string; sub: string; icon: React.ReactNode; tint: string }) {
  return (
    <div className="bg-[#161a38] px-5 py-4">
      <p className="flex items-center gap-1.5 text-xs text-ink-muted">
        <span style={{ color: tint }}>{icon}</span>
        {label}
      </p>
      <p className="font-display mt-1.5 text-[26px] font-semibold leading-none">{value}</p>
      <p className="mt-1 text-xs text-ink-faint">{sub}</p>
    </div>
  )
}

function OverallChart({ points, currentId }: { points: SessionSummary[]; currentId?: string }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const H = 280
  const pad = { l: 34, r: w < 520 ? 16 : 132, t: 26, b: 44 }
  const iw = Math.max(1, w - pad.l - pad.r)
  const ih = H - pad.t - pad.b
  const n = points.length
  const x = (i: number) => pad.l + (n === 1 ? iw / 2 : 18 + (i / (n - 1)) * (iw - 36))
  const y = (v: number) => pad.t + ih - (v / 100) * ih
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.overall!)}`).join(' ')
  const area = n > 1 ? `${line} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z` : ''
  const last = n - 1
  const showZoneLabels = w >= 520

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
      {w > 0 && (
        <>
          <svg width={w} height={H} role="img" aria-label={`Overall panel confidence by session, from ${points[0].overall}% to ${points[last].overall}%`}>
            <defs>
              <linearGradient id="journey-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#FFC627" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#FFC627" stopOpacity={0} />
              </linearGradient>
            </defs>
            {ZONES.map(z => (
              <rect key={z.label} x={pad.l} width={iw} y={y(z.to)} height={y(z.from) - y(z.to)} fill={VERDICTS[z.label].color} fillOpacity={0.055} />
            ))}
            {[0, 40, 70, 100].map(v => (
              <g key={v}>
                <line x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)} stroke={v === READY ? 'rgba(255,198,39,0.45)' : 'rgba(255,255,255,0.08)'} />
                <text x={pad.l - 8} y={y(v) + 3.5} textAnchor="end" className="fill-[#6f769c] text-[10px] tnum">
                  {v}
                </text>
              </g>
            ))}
            {area && <motion.path d={area} fill="url(#journey-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }} />}
            {n > 1 && (
              <motion.path
                d={line}
                fill="none"
                stroke="#FFC627"
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            )}
            {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="rgba(255,255,255,0.22)" />}
            {points.map((p, i) => {
              const isLast = i === last
              const current = p.id === currentId || (isLast && !currentId)
              return (
                <g key={p.id}>
                  {current && (
                    <motion.circle
                      cx={x(i)}
                      cy={y(p.overall!)}
                      r={7}
                      fill="#FFC627"
                      initial={{ opacity: 0.5, scale: 1 }}
                      animate={{ opacity: [0.45, 0, 0.45], scale: [1, 2.4, 1] }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                      style={{ transformOrigin: `${x(i)}px ${y(p.overall!)}px` }}
                    />
                  )}
                  <circle cx={x(i)} cy={y(p.overall!)} r={current ? 7 : 5} fill={p.sample ? '#141833' : '#FFC627'} stroke={p.sample ? '#FFC627' : '#141833'} strokeWidth={2} />
                  {(i === 0 || isLast) && (
                    <text x={x(i)} y={y(p.overall!) - 14} textAnchor="middle" className="fill-[#f5f5f7] text-[13px] font-semibold">
                      {p.overall}%
                    </text>
                  )}
                  <text x={x(i)} y={H - 24} textAnchor="middle" className={cx('text-[11px]', current ? 'fill-[#f5f5f7] font-semibold' : 'fill-[#a6acc9]')}>
                    {current ? 'This session' : `Session ${i + 1}`}
                  </text>
                  <text x={x(i)} y={H - 9} textAnchor="middle" className="fill-[#6f769c] text-[10px]">
                    {p.sample ? 'sample' : fmt(p.createdAt)}
                  </text>
                </g>
              )
            })}
            {points.map((p, i) => (
              <rect
                key={p.id}
                x={x(i) - Math.max(22, iw / n / 2)}
                y={pad.t}
                width={Math.max(44, iw / n)}
                height={ih}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                aria-label={`Session ${i + 1}: ${p.overall}%, ${p.verdict}`}
              />
            ))}
          </svg>
          {showZoneLabels &&
            ZONES.map(z => {
              const Z = z.icon
              const active = z === zoneOf(points[last].overall!)
              return (
                <div
                  key={z.label}
                  className={cx('pointer-events-none absolute flex items-center gap-1.5 text-[11.5px]', active ? 'font-semibold text-ink' : 'text-ink-faint')}
                  style={{ left: pad.l + iw + 12, top: (y(z.to) + y(z.from)) / 2 - 9 }}
                >
                  <Z weight="duotone" className="h-4 w-4 shrink-0" style={{ color: VERDICTS[z.label].color, opacity: active ? 1 : 0.6 }} />
                  {z.label}
                </div>
              )
            })}
        </>
      )}
      {hover != null && (
        <div
          className="pointer-events-none absolute z-10 w-[176px] rounded-xl bg-[#0f1228] px-3 py-2 text-xs shadow-xl ring-1 ring-white/10"
          style={{ left: Math.min(Math.max(0, x(hover) - 88), w - 176), top: Math.max(0, y(points[hover].overall!) - 86) }}
        >
          <p className="font-medium text-ink">
            Session {hover + 1} · {fmt(points[hover].createdAt)}
            {points[hover].sample ? ' · sample' : ''}
          </p>
          <p className="text-ink-muted">{points[hover].roleTitle}</p>
          <p className="mt-1 text-ink">
            {points[hover].verdict} · <span className="tnum">{points[hover].overall}%</span>
          </p>
        </div>
      )}
    </div>
  )
}

// One row per skill area: a hollow dot where it started, a gold dot where it is now, and the Ready line at 70.
function DomainRow({ domain, first, latest, count, index }: { domain: string; first: number; latest: number; count: number; index: number }) {
  const delta = latest - first
  const lo = Math.min(first, latest)
  return (
    <li className="grid grid-cols-[minmax(120px,170px)_1fr_auto] items-center gap-4">
      <p className="flex min-w-0 items-center gap-2 text-sm">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-ink-muted">
          <DomainIcon domain={domain} className="h-4 w-4" />
        </span>
        <span className="truncate">{domainLabel(domain)}</span>
      </p>
      <div className="relative h-2 rounded-full bg-white/[0.08]" role="img" aria-label={`${domainLabel(domain)}: ${first}% at first, ${latest}% latest`}>
        <span className="absolute -top-1.5 h-5 w-px bg-white/35" style={{ left: `${READY}%` }} />
        {count > 1 && (
          <motion.span
            className="absolute inset-y-0 rounded-full bg-gold/35"
            initial={{ left: `${first}%`, width: '0%' }}
            animate={{ left: `${lo}%`, width: `${Math.abs(delta)}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 + index * 0.08 }}
          />
        )}
        {count > 1 && <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#a6acc9] bg-[#161a38]" style={{ left: `${first}%` }} />}
        <motion.span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold ring-2 ring-[#161a38]"
          initial={{ left: `${first}%` }}
          animate={{ left: `${latest}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 + index * 0.08 }}
        />
      </div>
      <p className="flex w-[118px] items-center justify-end gap-2 text-sm tnum">
        {count > 1 && <span className="text-ink-faint">{first}%</span>}
        <span className="font-semibold">{latest}%</span>
        {count > 1 ? (
          <span className={cx('inline-flex min-w-[40px] items-center justify-end gap-0.5 text-xs font-semibold', delta > 0 ? 'text-good' : delta < 0 ? 'text-bad' : 'text-ink-faint')}>
            {delta > 0 ? <ArrowUpIcon weight="bold" className="h-3 w-3" /> : delta < 0 ? <ArrowDownIcon weight="bold" className="h-3 w-3" /> : null}
            {delta === 0 ? '±0' : Math.abs(delta)}
          </span>
        ) : (
          <span className="min-w-[40px] text-right text-[11px] text-ink-faint">new</span>
        )}
      </p>
    </li>
  )
}
