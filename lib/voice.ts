// Speaks a line in a character's voice: CreateAI speech when available, the browser's voices otherwise,
// and silent "reading pace" timing when voice is off, so captions always have something to follow.

type Progress = (fraction: number) => void

const PREFS: Record<string, { names: string[]; pitch: number; rate: number }> = {
  nova: { names: ['Samantha', 'Microsoft Aria', 'Google US English', 'Ava', 'Allison', 'Karen', 'Zira'], pitch: 1.05, rate: 1.02 },
  echo: { names: ['Microsoft Guy', 'Google UK English Male', 'Aaron', 'Alex', 'Tom', 'Rishi'], pitch: 1.0, rate: 1.04 },
  onyx: { names: ['Daniel', 'Arthur', 'Microsoft David', 'Fred', 'Gordon', 'Google UK English Male'], pitch: 0.82, rate: 0.96 },
  shimmer: { names: ['Moira', 'Karen', 'Microsoft Jenny', 'Google UK English Female', 'Tessa', 'Samantha'], pitch: 1.08, rate: 0.98 },
  alloy: { names: ['Google US English', 'Samantha', 'Alex'], pitch: 1, rate: 1 },
}

const audioCache = new Map<string, Promise<string | null>>()
let current: { stop: () => void } | null = null

function readingMs(text: string) {
  return Math.max(1400, text.length * 62)
}

function pickBrowserVoice(name: string) {
  if (typeof speechSynthesis === 'undefined') return null
  const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
  for (const pref of PREFS[name]?.names ?? []) {
    const hit = voices.find(v => v.name.includes(pref))
    if (hit) return hit
  }
  return voices[0] ?? null
}

export const voice = {
  enabled: true,
  server: false,

  prefetch(text: string, name: string) {
    if (!this.enabled || !this.server || !text) return
    const key = `${name}:${text}`
    if (audioCache.has(key)) return
    audioCache.set(
      key,
      fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice: name }) })
        .then(r => (r.ok ? r.blob() : null))
        .then(b => (b && b.size > 0 ? URL.createObjectURL(b) : null))
        .catch(() => null),
    )
  },

  stop() {
    current?.stop()
    current = null
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
  },

  speak(text: string, name: string, onProgress?: Progress): Promise<void> {
    this.stop()
    if (!this.enabled) return this.silent(text, onProgress)
    if (this.server) {
      this.prefetch(text, name)
      return audioCache.get(`${name}:${text}`)!.then(url => (url ? this.playUrl(url, text, onProgress) : this.browser(text, name, onProgress)))
    }
    return this.browser(text, name, onProgress)
  },

  silent(text: string, onProgress?: Progress) {
    return new Promise<void>(resolve => {
      const total = readingMs(text)
      const start = performance.now()
      let raf = 0
      const tick = () => {
        const f = Math.min(1, (performance.now() - start) / total)
        onProgress?.(f)
        if (f < 1) raf = requestAnimationFrame(tick)
        else resolve()
      }
      raf = requestAnimationFrame(tick)
      current = { stop: () => (cancelAnimationFrame(raf), onProgress?.(1), resolve()) }
    })
  },

  playUrl(url: string, text: string, onProgress?: Progress) {
    return new Promise<void>(resolve => {
      const el = new Audio(url)
      let raf = 0
      const done = () => {
        cancelAnimationFrame(raf)
        onProgress?.(1)
        resolve()
      }
      const tick = () => {
        if (el.duration > 0) onProgress?.(Math.min(1, el.currentTime / el.duration))
        raf = requestAnimationFrame(tick)
      }
      el.onended = done
      el.onerror = () => {
        cancelAnimationFrame(raf)
        void this.silent(text, onProgress).then(resolve)
      }
      el.play()
        .then(() => (raf = requestAnimationFrame(tick)))
        .catch(() => void this.silent(text, onProgress).then(resolve))
      current = { stop: () => (el.pause(), done()) }
    })
  },

  browser(text: string, name: string, onProgress?: Progress) {
    if (typeof speechSynthesis === 'undefined') return this.silent(text, onProgress)
    return new Promise<void>(resolve => {
      const u = new SpeechSynthesisUtterance(text)
      const v = pickBrowserVoice(name)
      if (v) u.voice = v
      u.pitch = PREFS[name]?.pitch ?? 1
      u.rate = PREFS[name]?.rate ?? 1
      const start = performance.now()
      const estimate = readingMs(text) / u.rate
      let boundary = false
      let raf = 0
      let finished = false
      const done = () => {
        if (finished) return
        finished = true
        cancelAnimationFrame(raf)
        onProgress?.(1)
        resolve()
      }
      const tick = () => {
        if (!boundary) onProgress?.(Math.min(0.97, (performance.now() - start) / estimate))
        raf = requestAnimationFrame(tick)
      }
      u.onboundary = e => {
        boundary = true
        onProgress?.(Math.min(1, (e.charIndex + (e.charLength || 0)) / text.length))
      }
      u.onend = done
      u.onerror = done
      speechSynthesis.speak(u)
      raf = requestAnimationFrame(tick)
      // Some browsers never fire onend for long utterances; don't let captions hang.
      const guard = setTimeout(done, estimate * 1.8 + 2500)
      current = { stop: () => (clearTimeout(guard), speechSynthesis.cancel(), done()) }
    })
  },
}

if (typeof window !== 'undefined' && typeof speechSynthesis !== 'undefined') {
  speechSynthesis.getVoices()
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices()
}
