"use client"

import { useEffect, useRef } from 'react'

// Live microphone level bars. With no analyser it animates a believable speech pattern (used for demo playback).
export function Waveform({ analyser, active, color = '#FFC627', bars = 36, height = 32 }: { analyser: AnalyserNode | null; active: boolean; color?: string; bars?: number; height?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const w = el.clientWidth
    el.width = w * dpr
    el.height = height * dpr
    ctx.scale(dpr, dpr)
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null
    const levels = new Array(bars).fill(0)
    let raf = 0
    let t = 0

    const draw = () => {
      t += 1
      if (analyser && data) analyser.getByteFrequencyData(data)
      ctx.clearRect(0, 0, w, height)
      const gap = 3
      const bw = Math.max(2, (w - gap * (bars - 1)) / bars)
      for (let i = 0; i < bars; i++) {
        let target = 0.06
        if (active) {
          if (data) {
            const idx = Math.floor((i / bars) * data.length * 0.55)
            target = Math.max(0.06, data[idx] / 255)
          } else {
            const envelope = 0.45 + 0.35 * Math.sin(t / 9) * Math.sin(t / 23)
            target = Math.max(0.08, envelope * (0.5 + 0.5 * Math.abs(Math.sin(i * 1.7 + t / 5))))
          }
        }
        levels[i] += (target - levels[i]) * 0.25
        const bh = Math.max(3, levels[i] * height)
        ctx.fillStyle = color
        ctx.globalAlpha = active ? 0.55 + levels[i] * 0.45 : 0.25
        const x = i * (bw + gap)
        const y = (height - bh) / 2
        ctx.beginPath()
        ctx.roundRect(x, y, bw, bh, bw / 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [analyser, active, color, bars, height])

  return <canvas ref={canvas} className="w-full" style={{ height }} aria-hidden />
}
