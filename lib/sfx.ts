// Tiny synthesized sound cues: no audio files, and never a negative sound.
let ctx: AudioContext | null = null

function audio() {
  if (typeof window === 'undefined') return null
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, start: number, duration: number, gain = 0.08, type: OscillatorType = 'sine') {
  const c = audio()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, c.currentTime + start)
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration)
  osc.connect(g).connect(c.destination)
  osc.start(c.currentTime + start)
  osc.stop(c.currentTime + start + duration + 0.05)
}

export const sfx = {
  enabled: true,
  unlock() {
    audio()
  },
  chime() {
    if (!this.enabled) return
    tone(880, 0, 0.5, 0.06)
    tone(1318.5, 0.09, 0.7, 0.05)
  },
  pop() {
    if (!this.enabled) return
    tone(520, 0, 0.18, 0.04, 'triangle')
  },
  reveal() {
    if (!this.enabled) return
    ;[392, 523.25, 659.25].forEach((f, i) => tone(f, i * 0.07, 0.6, 0.04))
  },
  celebrate() {
    if (!this.enabled) return
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.9, 0.06))
    tone(1567.98, 0.5, 1.2, 0.03)
  },
}
