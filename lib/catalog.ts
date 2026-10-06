import type { Reaction, Seat } from './types'

export interface Domain {
  key: string
  label: string
  focus: string
}

export const DOMAINS: Domain[] = [
  { key: 'frontend', label: 'Frontend', focus: 'UI components, state management, browser performance, accessibility' },
  { key: 'backend', label: 'Backend', focus: 'APIs, data modeling, databases, error handling, authentication' },
  { key: 'devops', label: 'DevOps & Cloud', focus: 'deployment, CI/CD, cloud hosting, monitoring, environments' },
  { key: 'uiux', label: 'UI/UX Design', focus: 'user research, design decisions, usability, visual hierarchy' },
  { key: 'data_ml', label: 'Data & ML', focus: 'model choice, training data, evaluation metrics, overfitting, deployment of models' },
  { key: 'data_analytics', label: 'Data & Analytics', focus: 'SQL, statistics, experiment design, turning data into decisions' },
  { key: 'system_design', label: 'System Design', focus: 'scaling, trade-offs, caching, architecture, reliability' },
  { key: 'qa', label: 'QA & Testing', focus: 'test strategy, unit vs integration tests, edge cases, catching regressions' },
  { key: 'mobile', label: 'Mobile', focus: 'native vs cross-platform, offline data, app lifecycle, device constraints' },
  { key: 'security', label: 'Security', focus: 'auth, input validation, secrets, common vulnerabilities' },
  { key: 'behavioral', label: 'Hiring Manager', focus: 'ownership, teamwork, conflict, learning from mistakes, motivation' },
]

export const domainLabel = (key: string) => DOMAINS.find(d => d.key === key)?.label ?? key

export interface Role {
  key: string
  title: string
  short: string
  icon: string
}

export const ROLES: Role[] = [
  { key: 'frontend', title: 'Frontend Developer', short: 'Frontend', icon: 'layout' },
  { key: 'backend', title: 'Backend Developer', short: 'Backend', icon: 'server' },
  { key: 'fullstack', title: 'Full-Stack Developer', short: 'Full-Stack', icon: 'layers' },
  { key: 'mobile', title: 'Mobile Developer', short: 'Mobile', icon: 'smartphone' },
  { key: 'data_analyst', title: 'Data Analyst', short: 'Data Analyst', icon: 'bar-chart' },
  { key: 'ml', title: 'ML Engineer', short: 'ML Engineer', icon: 'brain' },
  { key: 'devops', title: 'Cloud / DevOps Engineer', short: 'Cloud / DevOps', icon: 'cloud' },
  { key: 'uiux', title: 'UI/UX Designer', short: 'UI/UX Design', icon: 'pen' },
  { key: 'qa', title: 'QA / Test Engineer', short: 'QA / Testing', icon: 'check' },
  { key: 'security', title: 'Security Analyst', short: 'Security', icon: 'shield' },
]

export const LEVELS = ['Internship', 'New Grad', 'Full-time'] as const

export const SEATS: Record<Seat, { color: string; soft: string; voice: string; presentation: string }> = {
  0: { color: '#A78BFA', soft: 'rgba(167,139,250,0.18)', voice: 'nova', presentation: 'a woman' },
  1: { color: '#2DD4BF', soft: 'rgba(45,212,191,0.18)', voice: 'echo', presentation: 'a younger man' },
  2: { color: '#FB923C', soft: 'rgba(251,146,60,0.18)', voice: 'onyx', presentation: 'an older man' },
}

export const COACH = { name: 'Sam', voice: 'shimmer', color: '#FFC627' }

export const SEAT_IMAGES: Record<Seat, Record<'neutral' | 'smile' | 'worse', string>> = {
  0: { neutral: '/person1_neutral.png', smile: '/person1_smile.png', worse: '/person1_worse.png' },
  1: { neutral: '/person2_neutral.png', smile: '/person2_neutral.png', worse: '/person2_worse.png' },
  2: { neutral: '/person3_neutral.png', smile: '/person3_smile.png', worse: '/person3_worse.png' },
}

export const REACTIONS: Record<Reaction, { label: string; color: string; expression: 'neutral' | 'smile' | 'worse'; hint: string }> = {
  impressed: { label: 'Impressed', color: '#22C55E', expression: 'smile', hint: 'That landed.' },
  neutral: { label: 'Neutral', color: '#94A3B8', expression: 'neutral', hint: 'Keep going.' },
  probing: { label: 'Probing', color: '#F59E0B', expression: 'neutral', hint: 'Go deeper.' },
  skeptical: { label: 'Skeptical', color: '#F87171', expression: 'worse', hint: 'Back it up.' },
}

export const LINE_STATUS = {
  untested: { label: 'Untested', color: '#64748B' },
  green: { label: 'Defended', color: '#22C55E' },
  yellow: { label: 'Partly defended', color: '#F59E0B' },
  red: { label: 'Not yet defended', color: '#F87171' },
} as const

export const VERDICTS = {
  'Interview Ready': { color: '#FFC627', blurb: 'You can defend your work under real questioning.' },
  'Almost There': { color: '#F59E0B', blurb: 'Strong foundations. A few lines still need your story behind them.' },
  'Keep Practicing': { color: '#A78BFA', blurb: 'Every expert started here. Your path to ready is below.' },
} as const
