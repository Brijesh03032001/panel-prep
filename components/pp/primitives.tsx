"use client"

import { animate, motion, useReducedMotion } from 'framer-motion'
import {
  BrainIcon,
  BrowserIcon,
  BugIcon,
  ChartBarIcon,
  CircleDashedIcon,
  CloudArrowUpIcon,
  DeviceMobileIcon,
  HandshakeIcon,
  HardDrivesIcon,
  LockKeyIcon,
  MagnifyingGlassIcon,
  MinusCircleIcon,
  PenNibIcon,
  SealQuestionIcon,
  ShieldCheckIcon,
  ShieldSlashIcon,
  ShieldWarningIcon,
  StackIcon,
  ThumbsUpIcon,
  TreeStructureIcon,
  type Icon,
} from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { LINE_STATUS, REACTIONS, SEAT_IMAGES } from '@/lib/catalog'
import type { LineStatus, Reaction, Seat } from '@/lib/types'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

// Darker step of a seat or status color, so names and labels stay readable on light surfaces.
export function deep(hex: string, f = 0.62) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * f)
  const g = Math.round(((n >> 8) & 255) * f)
  const b = Math.round((n & 255) * f)
  return `rgb(${r},${g},${b})`
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 36 : size === 'sm' ? 22 : 28
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="#141833" stroke="rgba(255,255,255,0.14)" />
        <circle cx="9" cy="13" r="3.2" fill="#A78BFA" />
        <circle cx="16" cy="11" r="3.2" fill="#2DD4BF" />
        <circle cx="23" cy="13" r="3.2" fill="#FB923C" />
        <path d="M8 22.5c2.2-2.6 5-3.9 8-3.9s5.8 1.3 8 3.9" stroke="#FFC627" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </svg>
      <span className={cx('font-display font-semibold tracking-tight', size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg')}>
        Panel Prep
      </span>
    </div>
  )
}

export function AnimatedNumber({ value, className, prefix = '', suffix = '', duration = 0.9 }: { value: number; className?: string; prefix?: string; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(value)
  const from = useRef(value)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      from.current = value
      return
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => setDisplay(Math.round(v)),
    })
    from.current = value
    return () => controls.stop()
  }, [value, duration, reduce])
  return (
    <span className={cx('tnum', className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}

export function ScoreRing({
  value,
  color,
  size = 56,
  stroke = 5,
  label,
  className,
}: {
  value: number
  color: string
  size?: number
  stroke?: number
  label?: string
  className?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className={cx('relative shrink-0', className)} style={{ width: size, height: size }} role="img" aria-label={`${label ?? 'Confidence'} ${value}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(100, value)) / 100) }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatedNumber value={value} suffix="%" className="font-display text-[0.8rem] font-semibold" />
      </div>
    </div>
  )
}

const REACTION_ICONS: Record<Reaction, Icon> = {
  impressed: ThumbsUpIcon,
  neutral: MinusCircleIcon,
  probing: MagnifyingGlassIcon,
  skeptical: SealQuestionIcon,
}

export function ReactionChip({ reaction, size = 'sm' }: { reaction: Reaction; size?: 'sm' | 'md' }) {
  const meta = REACTIONS[reaction]
  const Icon = REACTION_ICONS[reaction]
  return (
    <motion.span
      key={reaction}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]',
      )}
      style={{ color: meta.color, background: `${meta.color}1f`, boxShadow: `inset 0 0 0 1px ${meta.color}40` }}
    >
      <Icon weight="duotone" className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} aria-hidden />
      {meta.label}
    </motion.span>
  )
}

const STATUS_ICONS: Record<LineStatus, Icon> = {
  untested: CircleDashedIcon,
  green: ShieldCheckIcon,
  yellow: ShieldWarningIcon,
  red: ShieldSlashIcon,
}

export function StatusIcon({ status, className }: { status: LineStatus; className?: string }) {
  const Icon = STATUS_ICONS[status]
  return (
    <Icon
      weight="duotone"
      className={cx('shrink-0', className)}
      style={{ color: LINE_STATUS[status].color }}
      aria-label={LINE_STATUS[status].label}
    />
  )
}

const DOMAIN_ICONS: Record<string, Icon> = {
  frontend: BrowserIcon,
  backend: HardDrivesIcon,
  devops: CloudArrowUpIcon,
  uiux: PenNibIcon,
  data_ml: BrainIcon,
  data_analytics: ChartBarIcon,
  system_design: TreeStructureIcon,
  qa: BugIcon,
  mobile: DeviceMobileIcon,
  security: LockKeyIcon,
  behavioral: HandshakeIcon,
}

export function DomainIcon({ domain, className, style }: { domain: string; className?: string; style?: React.CSSProperties }) {
  const Icon = DOMAIN_ICONS[domain] ?? StackIcon
  return <Icon weight="duotone" className={className} style={style} aria-hidden />
}

const ROLE_ICONS: Record<string, Icon> = {
  layout: BrowserIcon,
  server: HardDrivesIcon,
  layers: StackIcon,
  smartphone: DeviceMobileIcon,
  'bar-chart': ChartBarIcon,
  brain: BrainIcon,
  cloud: CloudArrowUpIcon,
  pen: PenNibIcon,
  check: BugIcon,
  shield: LockKeyIcon,
}

export function RoleIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ROLE_ICONS[icon] ?? StackIcon
  return <Icon weight="duotone" className={className} aria-hidden />
}

const FACE_CROP: Record<Seat, { scale: number; x: string; y: string }> = {
  0: { scale: 2.6, x: '50%', y: '6%' },
  1: { scale: 2.6, x: '49%', y: '7%' },
  2: { scale: 2.6, x: '52%', y: '9%' },
}

export function Avatar({ seat, size = 40, expression = 'neutral', ring }: { seat: Seat; size?: number; expression?: 'neutral' | 'smile' | 'worse'; ring?: string }) {
  const crop = FACE_CROP[seat]
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-surface-3"
      style={{ width: size, height: size, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SEAT_IMAGES[seat][expression]}
        alt=""
        draggable={false}
        className="absolute max-w-none select-none"
        style={{
          width: size * crop.scale,
          left: '50%',
          top: 0,
          transform: `translate(-${crop.x}, -${crop.y})`,
        }}
      />
    </div>
  )
}

export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  const tinted = /(^|\s)text-(?!\[)/.test(className ?? '')
  return <p className={cx('font-mono text-[11px] uppercase tracking-[0.18em]', !tinted && 'text-ink-faint', className)}>{children}</p>
}
