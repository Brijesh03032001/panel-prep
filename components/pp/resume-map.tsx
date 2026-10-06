"use client"

import { QuotesIcon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LINE_STATUS } from '@/lib/catalog'
import type { Interviewer, LineStatus, ResumeLine } from '@/lib/types'
import { AnimatedNumber, StatusIcon, cx } from './primitives'

const FLAG_LABEL = { strength: 'Strength', gap: 'Needs the how', shaky: 'Sounds shaky' } as const
const FLAG_COLOR = { strength: '#22C55E', gap: '#F59E0B', shaky: '#F87171' } as const
const ORDER: LineStatus[] = ['green', 'yellow', 'red', 'untested']

export function MapTally({ lines, className }: { lines: ResumeLine[]; className?: string }) {
  const counts = useMemo(() => {
    const c: Record<LineStatus, number> = { green: 0, yellow: 0, red: 0, untested: 0 }
    lines.forEach(l => c[l.status]++)
    return c
  }, [lines])
  const total = lines.length || 1
  return (
    <div className={className}>
      <div className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Share of resume lines by status">
        {ORDER.map(s =>
          counts[s] > 0 ? (
            <motion.div
              key={s}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ background: s === 'untested' ? 'rgba(255,255,255,0.12)' : LINE_STATUS[s].color }}
              initial={false}
              animate={{ width: `${(counts[s] / total) * 100}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            />
          ) : null,
        )}
      </div>
      <div className="mt-2.5 grid grid-cols-4 gap-1">
        {ORDER.map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <StatusIcon status={s} className="h-3.5 w-3.5" />
            <span className="text-[11px] leading-tight text-ink-muted">
              <AnimatedNumber value={counts[s]} className="font-semibold text-ink" /> {s === 'green' ? 'Defended' : s === 'yellow' ? 'Partly' : s === 'red' ? 'Not yet' : 'Untested'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ResumeMap({
  lines,
  panel,
  activeLineIds = [],
  activeColor,
  activeName,
  showFlags = true,
  className,
  header = true,
}: {
  lines: ResumeLine[]
  panel: Interviewer[]
  activeLineIds?: string[]
  activeColor?: string
  activeName?: string
  showFlags?: boolean
  className?: string
  header?: boolean
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const sections = useMemo(() => {
    const out: { name: string; lines: ResumeLine[] }[] = []
    for (const l of lines) {
      const last = out[out.length - 1]
      if (last && last.name === l.section) last.lines.push(l)
      else out.push({ name: l.section, lines: [l] })
    }
    return out
  }, [lines])

  const activeKey = activeLineIds.join(',')
  // Scroll only the list itself; scrollIntoView would also scroll the fixed page shell.
  useEffect(() => {
    const box = scroller.current
    if (!activeKey || !box) return
    const el = box.querySelector<HTMLElement>(`[data-line="${activeKey.split(',')[0]}"]`)
    if (!el) return
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
    box.scrollTo({ top: top - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' })
  }, [activeKey])

  return (
    <div className={cx('flex min-h-0 flex-col', className)}>
      {header && (
        <div className="shrink-0 px-5 pb-4 pt-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-base font-semibold">Defensibility Map</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Live</span>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Every line you can defend turns green.</p>
          <MapTally lines={lines} className="mt-4" />
        </div>
      )}
      <div ref={scroller} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {sections.map(section => (
          <div key={section.name} className="mb-3">
            <p className="px-2 pb-1.5 pt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">{section.name}</p>
            <div className="space-y-1">
              {section.lines.map(line => (
                <LineRow
                  key={line.id}
                  line={line}
                  panel={panel}
                  active={activeLineIds.includes(line.id)}
                  activeColor={activeColor}
                  activeName={activeName}
                  showFlag={showFlags}
                  open={openId === line.id}
                  onToggle={() => setOpenId(openId === line.id ? null : line.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LineRow({
  line,
  panel,
  active,
  activeColor,
  activeName,
  showFlag,
  open,
  onToggle,
}: {
  line: ResumeLine
  panel: Interviewer[]
  active: boolean
  activeColor?: string
  activeName?: string
  showFlag: boolean
  open: boolean
  onToggle: () => void
}) {
  const status = LINE_STATUS[line.status]
  const tint = line.status === 'untested' ? 'transparent' : `${status.color}14`
  const testers = panel.filter(p => line.testedBy.includes(p.id))
  return (
    <motion.div
      data-line={line.id}
      layout="position"
      className="relative overflow-hidden rounded-xl"
      initial={false}
      animate={{ backgroundColor: active ? `${activeColor ?? '#FFC627'}1c` : tint }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {line.status !== 'untested' && (
          <motion.span
            key={line.status}
            className="pointer-events-none absolute inset-0"
            style={{ background: status.color }}
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
      {active && (
        <motion.span
          className="absolute inset-y-1 left-0 w-[3px] rounded-full"
          style={{ background: activeColor }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
      <button type="button" onClick={onToggle} className="relative flex w-full items-start gap-2.5 px-2.5 py-2 text-left" aria-expanded={open}>
        <motion.span key={line.status} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }} className="mt-[2px]">
          <StatusIcon status={line.status} className="h-4 w-4" />
        </motion.span>
        <span className="min-w-0 flex-1">
          <span className={cx('block text-[13px] leading-snug', line.status === 'untested' ? 'text-ink-muted' : 'text-ink')}>{line.text}</span>
          {active ? (
            <span className="mt-1 inline-block font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: activeColor }}>
              Being tested{activeName ? ` by ${activeName}` : ''}
            </span>
          ) : line.status !== 'untested' ? (
            <span className="mt-1 inline-block text-[10px] font-medium" style={{ color: status.color }}>
              {status.label}
            </span>
          ) : showFlag && line.flag ? (
            <span className="mt-1 inline-flex items-center gap-1 text-[10px]" style={{ color: FLAG_COLOR[line.flag] }}>
              <span className="h-1 w-1 rounded-full" style={{ background: FLAG_COLOR[line.flag] }} />
              {FLAG_LABEL[line.flag]}
              {line.flagNote ? <span className="text-ink-faint">· {line.flagNote}</span> : null}
            </span>
          ) : null}
        </span>
        {testers.length > 0 && (
          <span className="mt-1 flex -space-x-1">
            {testers.map(t => (
              <span key={t.id} title={`Tested by ${t.name}`} className="h-2.5 w-2.5 rounded-full ring-2 ring-[#141833]" style={{ background: t.color }} />
            ))}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && line.evidence && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative overflow-hidden">
            <p className="mx-2.5 mb-2.5 flex gap-2 rounded-lg bg-black/25 px-2.5 py-2 text-[12px] italic text-ink-muted">
              <QuotesIcon weight="duotone" className="mt-0.5 h-3 w-3 shrink-0 text-ink-faint" />
              {line.evidence}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
