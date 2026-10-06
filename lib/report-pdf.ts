import { domainLabel, REACTIONS, VERDICTS } from './catalog'
import type { LineStatus, Reaction, SessionDoc, VerdictLabel } from './types'

// Two pages a student will actually read: page 1 is the verdict at a glance, page 2 the details.
// jsPDF's standard fonts are WinAnsi only, so no arrows or other symbols outside that set.

type RGB = [number, number, number]
const hex = (h: string): RGB => {
  const n = parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const INK: RGB = hex('#16182d')
const MUTED: RGB = hex('#545a78')
const FAINT: RGB = hex('#868ba6')
const LINE: RGB = hex('#e6e4ec')
const PAPER: RGB = hex('#f7f5f0')
const MAROON: RGB = hex('#8C1D40')
const GOLD: RGB = hex('#FFC627')
const GOLD_INK: RGB = hex('#8a6300')
const GREEN: RGB = hex('#15803d')
const WHITE: RGB = [255, 255, 255]

const VERDICT_INK: Record<VerdictLabel, RGB> = {
  'Interview Ready': hex('#8a6300'),
  'Almost There': hex('#b45309'),
  'Keep Practicing': hex('#6d28d9'),
}
const REACTION_INK: Record<Reaction, RGB> = {
  impressed: hex('#15803d'),
  neutral: hex('#545a78'),
  probing: hex('#b45309'),
  skeptical: hex('#b91c1c'),
}
const STATUS_INK: Record<LineStatus, RGB> = {
  green: hex('#15803d'),
  yellow: hex('#b45309'),
  red: hex('#b91c1c'),
  untested: hex('#868ba6'),
}
const STATUS_SHORT: Record<LineStatus, string> = { green: 'DEFENDED', yellow: 'PARTLY', red: 'NOT YET', untested: 'UNTESTED' }

const clip = (t: string, max: number) => (t.length > max ? `${t.slice(0, max - 1).trimEnd()}...` : t)
const first = (name: string) => name.split(' ')[0]

export async function downloadCoachingReport(session: SessionDoc) {
  const doc = await buildCoachingReport(session)
  doc.save(`panel-prep-coaching-report-${session.setup.roleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`)
}

export async function buildCoachingReport(session: SessionDoc) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 44
  const CW = W - M * 2
  const BOTTOM = H - 56
  const outcome = session.outcome
  const who = (id: string) => session.panel.find(p => p.id === id)
  let y = 0

  const font = (size: number, style: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal', color: RGB = INK) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
  }
  const wrap = (t: string, width: number, size: number, style: 'normal' | 'bold' | 'italic' = 'normal') => {
    font(size, style)
    return doc.splitTextToSize(t, width) as string[]
  }
  /** Draws wrapped lines and returns the height used. */
  const para = (lines: string[], x: number, top: number, size: number, style: 'normal' | 'bold' | 'italic' = 'normal', color: RGB = INK, lh = 1.38) => {
    font(size, style, color)
    lines.forEach((l, i) => doc.text(l, x, top + size + i * size * lh - 2))
    return lines.length * size * lh
  }
  const fill = (c: RGB) => doc.setFillColor(...c)
  const stroke = (c: RGB) => doc.setDrawColor(...c)
  const ensure = (space: number) => {
    if (y + space > BOTTOM) {
      doc.addPage()
      y = M
    }
  }
  const kicker = (t: string, x: number, top: number, color: RGB = MAROON) => {
    font(7.5, 'bold', color)
    doc.text(t.toUpperCase(), x, top, { charSpace: 1.1 })
  }
  const section = (t: string, space = 60) => {
    ensure(space)
    kicker(t, M, y + 8)
    stroke(LINE)
    doc.setLineWidth(0.8)
    doc.line(M + doc.getTextWidth(t.toUpperCase()) + t.length * 1.1 + 10, y + 5, W - M, y + 5)
    y += 22
  }
  const arc = (cx: number, cy: number, r: number, from: number, to: number, color: RGB, width: number) => {
    stroke(color)
    doc.setLineWidth(width)
    doc.setLineCap('round')
    const steps = Math.max(2, Math.ceil(Math.abs(to - from) / 3))
    for (let i = 0; i < steps; i++) {
      const a1 = ((from + ((to - from) * i) / steps - 90) * Math.PI) / 180
      const a2 = ((from + ((to - from) * (i + 1)) / steps - 90) * Math.PI) / 180
      doc.line(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cx + Math.cos(a2) * r, cy + Math.sin(a2) * r)
    }
    doc.setLineCap('butt')
  }
  const check = (cx: number, cy: number, color: RGB) => {
    fill(color)
    doc.circle(cx, cy, 6.5, 'F')
    stroke(WHITE)
    doc.setLineWidth(1.5)
    doc.setLineCap('round')
    doc.line(cx - 2.8, cy + 0.2, cx - 0.8, cy + 2.4)
    doc.line(cx - 0.8, cy + 2.4, cx + 3, cy - 2.2)
    doc.setLineCap('butt')
  }
  const badge = (cx: number, cy: number, n: number) => {
    fill(GOLD)
    doc.circle(cx, cy, 7, 'F')
    font(8.5, 'bold', INK)
    doc.text(String(n), cx, cy + 3, { align: 'center' })
  }
  const pill = (t: string, x: number, top: number, color: RGB, align: 'left' | 'right' = 'left') => {
    font(7, 'bold', color)
    const w = doc.getTextWidth(t) + t.length * 0.6 + 12
    const left = align === 'right' ? x - w : x
    fill(color.map(c => Math.round(c + (255 - c) * 0.88)) as RGB)
    doc.roundedRect(left, top, w, 14, 7, 7, 'F')
    doc.text(t, left + 6, top + 9.8, { charSpace: 0.6 })
    return w
  }

  // ── Header band: the ASU maroon and gold.
  fill(MAROON)
  doc.rect(0, 0, W, 88, 'F')
  fill(GOLD)
  doc.rect(0, 88, W, 3.5, 'F')
  font(22, 'bold', WHITE)
  doc.text('Panel Prep', M, 42)
  kicker('Coaching report', M, 60, GOLD)
  font(10, 'normal', WHITE)
  doc.text(`${session.setup.roleTitle} · ${session.setup.level}`, W - M, 38, { align: 'right' })
  doc.text(new Date(session.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), W - M, 53, { align: 'right' })
  if (session.mode === 'demo') {
    font(8.5, 'italic', hex('#f3c9d6'))
    doc.text('Sample session (fictional student)', W - M, 68, { align: 'right' })
  }
  y = 116

  if (outcome) {
    const v = outcome.verdict
    const s = outcome.stats
    const vInk = VERDICT_INK[v.label]
    const vColor = hex(VERDICTS[v.label].color)

    // ── Verdict: a gauge, the label, and where it sits on the scale.
    const gx = M + 54
    const gy = y + 56
    arc(gx, gy, 50, 0, 360, LINE, 8)
    if (v.overall > 0) arc(gx, gy, 50, 0, (v.overall / 100) * 360, vColor, 8)
    font(24, 'bold', INK)
    doc.text(`${v.overall}%`, gx, gy + 3, { align: 'center' })
    font(6, 'bold', FAINT)
    doc.text('PANEL CONFIDENCE', gx, gy + 14, { align: 'center', charSpace: 0.5 })

    const tx = M + 136
    const tw = CW - 136
    kicker('Your coaching verdict', tx, y + 12)
    font(26, 'bold', vInk)
    doc.text(v.label, tx, y + 42)
    const blurb = wrap(VERDICTS[v.label].blurb, tw, 10.5)
    para(blurb, tx, y + 50, 10.5, 'normal', MUTED)

    const sy = y + 84
    const zones: { label: VerdictLabel; from: number; to: number }[] = [
      { label: 'Keep Practicing', from: 0, to: 40 },
      { label: 'Almost There', from: 40, to: 70 },
      { label: 'Interview Ready', from: 70, to: 100 },
    ]
    const sw = Math.min(tw, 330)
    zones.forEach(z => {
      const x0 = tx + (z.from / 100) * sw + (z.from ? 1.5 : 0)
      const x1 = tx + (z.to / 100) * sw - (z.to < 100 ? 1.5 : 0)
      const active = v.overall >= z.from && (v.overall < z.to || z.to === 100)
      const c = hex(VERDICTS[z.label].color)
      fill(active ? c : (c.map(k => Math.round(k + (255 - k) * 0.7)) as RGB))
      doc.roundedRect(x0, sy, x1 - x0, 6, 3, 3, 'F')
      font(7.5, active ? 'bold' : 'normal', active ? INK : FAINT)
      doc.text(z.label, x0, sy + 18)
    })
    const mx = tx + (Math.max(1, Math.min(99, v.overall)) / 100) * sw
    fill(WHITE)
    stroke(INK)
    doc.setLineWidth(1.6)
    doc.circle(mx, sy + 3, 5, 'FD')
    const next = zones.find(z => z.from > v.overall)
    font(9.5, 'bold', INK)
    doc.text(next ? `${next.from - v.overall} points from ${next.label}.` : `Cleared the Interview Ready bar by ${v.overall - 70} points.`, tx, sy + 36)
    y += 140

    // ── Four numbers.
    const gain = s.comeback ?? s.biggestGain
    const gainWho = gain ? who(gain.interviewerId) : null
    const toughest = session.panel.length > 1 ? who(s.toughestCritic ?? '') : undefined
    const kpis = [
      s.linesDefended === 0 && s.linesPartial > 0
        ? { value: `${s.linesPartial} of ${s.linesTested}`, label: 'resume lines partly defended', color: STATUS_INK.yellow }
        : { value: `${s.linesDefended} of ${s.linesTested}`, label: 'resume lines defended', color: GREEN },
      gain && gain.delta > 0
        ? { value: `+${gain.delta}`, label: `${s.comeback ? 'biggest comeback' : 'biggest win'}${gainWho ? `, with ${first(gainWho.name)}` : ''}`, color: s.comeback ? GOLD_INK : GREEN }
        : { value: String(session.turns.filter(t => t.attempts.length).length), label: 'questions answered', color: INK },
      ...(s.strongestDomain ? [{ value: s.strongestDomain, label: 'your strongest area', color: MAROON }] : []),
      ...(toughest ? [{ value: first(toughest.name), label: `next to win over: the least convinced (${toughest.confidence}%)`, color: hex(toughest.color).map(k => Math.round(k * 0.62)) as RGB }] : []),
    ]
    const gap = 8
    const kw = (CW - gap * (kpis.length - 1)) / kpis.length
    kpis.forEach((k, i) => {
      const x = M + i * (kw + gap)
      fill(PAPER)
      doc.roundedRect(x, y, kw, 54, 8, 8, 'F')
      fill(k.color)
      doc.roundedRect(x, y, 3, 54, 1.5, 1.5, 'F')
      font(16, 'bold', k.color)
      doc.text(clip(k.value, 16), x + 12, y + 23)
      para(wrap(k.label, kw - 20, 8).slice(0, 2), x + 12, y + 29, 8, 'normal', MUTED, 1.3)
    })
    y += 76

    // ── What went well, and what to focus on next.
    const colW = (CW - 24) / 2
    const wins = outcome.perInterviewer
      .filter(p => p.strongest)
      .map(p => ({ text: p.strongest, by: who(p.interviewerId) }))
      .slice(0, 3)
    const focus = outcome.topPractice.slice(0, 3)
    const top = y
    kicker('What went well', M, y + 8, GREEN)
    kicker('Focus on next', M + colW + 24, y + 8, GOLD_INK)
    let ly = y + 20
    wins.forEach(w => {
      check(M + 6.5, ly + 7, GREEN)
      const lines = wrap(w.text, colW - 24, 10.5, 'bold')
      ly += para(lines, M + 20, ly, 10.5, 'bold')
      if (w.by) {
        font(8.5, 'normal', FAINT)
        doc.text(`${first(w.by.name)}, ${w.by.title}`, M + 20, ly + 8)
        ly += 12
      }
      ly += 8
    })
    if (s.linesDefended > 0) {
      check(M + 6.5, ly + 7, GREEN)
      ly += para(wrap(`You backed up ${s.linesDefended} resume ${s.linesDefended === 1 ? 'line' : 'lines'} under questioning.`, colW - 24, 10.5, 'bold'), M + 20, ly, 10.5, 'bold') + 8
    }
    let ry = y + 20
    focus.forEach((f, i) => {
      badge(M + colW + 24 + 7, ry + 7, i + 1)
      ry += para(wrap(f, colW - 26, 10.5), M + colW + 24 + 22, ry, 10.5) + 10
    })
    y = Math.max(ly, ry, top + 60) + 10

    // ── Sam's note.
    const note = wrap(outcome.coachSummary || 'Keep practicing out loud with real examples from your own work.', CW - 40, 10.5)
    const nh = note.length * 10.5 * 1.42 + 44
    ensure(nh + 10)
    fill(hex('#fff6da'))
    doc.roundedRect(M, y, CW, nh, 10, 10, 'F')
    fill(GOLD)
    doc.roundedRect(M, y, 4, nh, 2, 2, 'F')
    fill(GOLD)
    doc.circle(M + 26, y + 18, 9, 'F')
    font(10, 'bold', INK)
    doc.text('S', M + 26, y + 21.5, { align: 'center' })
    font(10, 'bold', GOLD_INK)
    doc.text("Sam's note", M + 42, y + 17)
    font(8, 'normal', MUTED)
    doc.text('Your coach, fully on your side', M + 42, y + 27)
    para(note, M + 20, y + 38, 10.5, 'normal', INK, 1.42)
    y += nh + 22

    if (outcome.drills.length) {
      section('60-second drills: answer out loud, timer running', 80)
      const dw = (CW - 16) / Math.min(3, outcome.drills.length)
      const blocks = outcome.drills.slice(0, 3).map(d => ({ d, lines: wrap(d.prompt, dw - 22, 9) }))
      const dh = Math.max(...blocks.map(b => b.lines.length)) * 9 * 1.38 + 32
      ensure(dh + 6)
      blocks.forEach(({ d, lines }, i) => {
        const x = M + i * (dw + 8)
        stroke(LINE)
        doc.setLineWidth(0.9)
        doc.roundedRect(x, y, dw, dh, 8, 8, 'S')
        const by = who(d.interviewerId)
        if (by) {
          fill(hex(by.color))
          doc.circle(x + 14, y + 15, 3.5, 'F')
        }
        font(9.5, 'bold', INK)
        doc.text(clip(d.title, 34), x + 22, y + 18)
        para(lines, x + 11, y + 26, 9, 'normal', MUTED)
      })
      y += dh + 20
    }

    // ── Page 2: the details.
    doc.addPage()
    y = M

    section('How each interviewer saw you', 170)
    const cw3 = (CW - 16) / 3
    const cardTop = y
    const heights = session.panel.map((p, i) => {
      const x = M + i * (cw3 + 8)
      const fb = outcome.perInterviewer.find(f => f.interviewerId === p.id)
      const take = wrap(fb?.takeaway ?? '', cw3 - 24, 9)
      return { p, x, take, h: 104 + take.length * 9 * 1.38 }
    })
    const ch = Math.max(...heights.map(c => c.h))
    heights.forEach(({ p, x, take }) => {
      const color = hex(p.color)
      const ink = color.map(k => Math.round(k * 0.62)) as RGB
      fill(PAPER)
      doc.roundedRect(x, cardTop, cw3, ch, 8, 8, 'F')
      fill(color)
      doc.rect(x + 8, cardTop, cw3 - 16, 3, 'F')
      font(11, 'bold', INK)
      doc.text(clip(p.name, 24), x + 12, cardTop + 22)
      font(8, 'normal', MUTED)
      doc.text(clip(`${p.title} · ${domainLabel(p.domain)}`, 40), x + 12, cardTop + 34)
      font(20, 'bold', INK)
      doc.text(`${p.confidence}%`, x + 12, cardTop + 60)
      const delta = p.confidence - p.startConfidence
      font(8.5, 'bold', delta > 0 ? GREEN : delta < 0 ? STATUS_INK.red : MUTED)
      doc.text(`${delta > 0 ? '+' : ''}${delta} from ${p.startConfidence}%`, x + cw3 - 12, cardTop + 60, { align: 'right' })
      const bx = x + 12
      const bw = cw3 - 24
      fill(LINE)
      doc.roundedRect(bx, cardTop + 68, bw, 4, 2, 2, 'F')
      const a = bx + (Math.min(p.startConfidence, p.confidence) / 100) * bw
      const b = bx + (Math.max(p.startConfidence, p.confidence) / 100) * bw
      fill(color.map(k => Math.round(k + (255 - k) * 0.45)) as RGB)
      doc.rect(a, cardTop + 68, Math.max(0, b - a), 4, 'F')
      fill(WHITE)
      stroke(color)
      doc.setLineWidth(1.3)
      doc.circle(bx + (p.startConfidence / 100) * bw, cardTop + 70, 3.2, 'FD')
      fill(color)
      doc.circle(bx + (p.confidence / 100) * bw, cardTop + 70, 3.8, 'F')
      font(7, 'bold', ink)
      doc.text('DO THIS NEXT', x + 12, cardTop + 90, { charSpace: 0.8 })
      para(take, x + 12, cardTop + 94, 9, 'normal', INK)
    })
    y = cardTop + ch + 22

    // Defensibility Map: only the lines the panel tested; the rest is a count.
    const tested = (['green', 'yellow', 'red'] as LineStatus[]).flatMap(st => session.resume.lines.filter(l => l.status === st))
    const untested = session.resume.lines.length - tested.length
    section('Your Defensibility Map', 70)
    font(11, 'bold', INK)
    doc.text(
      s.linesTested ? `You defended ${s.linesDefended} of ${s.linesTested} lines your panel tested.` : 'Your panel did not test specific lines this time.',
      M,
      y + 4,
    )
    y += 16
    tested.forEach(l => {
      const lines = wrap(l.text, CW - 92, 9.5)
      const h = lines.length * 9.5 * 1.38 + 8
      ensure(h + 4)
      pill(STATUS_SHORT[l.status], M, y + 1, STATUS_INK[l.status])
      para(lines, M + 78, y, 9.5)
      y += h
    })
    if (untested > 0) {
      font(8.5, 'italic', FAINT)
      doc.text(`${untested} more ${untested === 1 ? 'line' : 'lines'} never came up. Your next panel might ask about ${untested === 1 ? 'it' : 'them'}.`, M, y + 6)
      y += 14
    }
    y += 12

    // Question by question, condensed: the question, how it landed, one line of feedback.
    const answered = session.turns.filter(t => t.attempts.length)
    if (answered.length) {
      section('Question by question', 80)
      answered.forEach((t, i) => {
        const p = who(t.interviewerId)
        const final = t.attempts[t.attempts.length - 1].result
        const firstTry = t.attempts.length > 1 ? t.attempts[0].result : null
        const q = wrap(`“${t.question}”`, CW - 20, 9.5, 'italic')
        const fbLines = final.feedback ? wrap(clip(final.feedback, 260), CW - 20, 9.5) : []
        const h = 16 + q.length * 9.5 * 1.38 + (firstTry ? 13 : 0) + fbLines.length * 9.5 * 1.38 + 14
        ensure(h)
        font(10, 'bold', INK)
        doc.text(`Q${i + 1}  ${p ? `${p.name} · ${p.title}` : 'Interviewer'}${t.kind === 'follow-up' ? '  (follow-up)' : ''}`, M, y + 9)
        const label = `${REACTIONS[final.reaction].label.toUpperCase()}  ${final.scoreDelta >= 0 ? '+' : ''}${final.scoreDelta}`
        pill(label, W - M, y, REACTION_INK[final.reaction], 'right')
        y += 16
        y += para(q, M + 10, y, 9.5, 'italic', MUTED)
        if (firstTry) {
          font(8.5, 'normal', GOLD_INK)
          doc.text(`First try: ${REACTIONS[firstTry.reaction].label} ${firstTry.scoreDelta >= 0 ? '+' : ''}${firstTry.scoreDelta}. Then a Lifeline hint and a stronger second try.`, M + 10, y + 8)
          y += 13
        }
        if (fbLines.length) y += para(fbLines, M + 10, y + 2, 9.5)
        y += 10
        if (i < answered.length - 1) {
          stroke(LINE)
          doc.setLineWidth(0.6)
          doc.line(M, y - 4, W - M, y - 4)
        }
      })
    }
  } else {
    section('Your Defensibility Map')
    session.resume.lines.forEach(l => {
      const lines = wrap(l.text, CW - 92, 9.5)
      ensure(lines.length * 13 + 8)
      pill(STATUS_SHORT[l.status], M, y + 1, STATUS_INK[l.status])
      y += para(lines, M + 78, y, 9.5) + 8
    })
  }

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    stroke(LINE)
    doc.setLineWidth(0.6)
    doc.line(M, H - 40, W - M, H - 40)
    font(8, 'normal', FAINT)
    doc.text('A practice signal for you alone. Never a hiring decision, never shared with employers.', M, H - 26)
    doc.text(`Panel Prep · page ${i} of ${pages}`, W - M, H - 26, { align: 'right' })
  }

  return doc
}
