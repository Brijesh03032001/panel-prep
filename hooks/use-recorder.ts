"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

type RecState = 'idle' | 'recording' | 'transcribing'

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null
  const Ctor = (window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  return Ctor ? new (Ctor as new () => SpeechRecognitionLike)() : null
}

// Records the answer (kept locally for the Highlight Reel) and turns it into text. With CreateAI configured,
// transcription runs on ASU-approved Whisper; otherwise the browser's speech recognition gives live captions.
export function useRecorder(serverSTT: boolean) {
  const [state, setState] = useState<RecState>('idle')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const media = useRef<{ stream: MediaStream; recorder: MediaRecorder; chunks: Blob[]; ctx: AudioContext } | null>(null)
  const recognition = useRef<SpeechRecognitionLike | null>(null)
  const finalText = useRef('')
  const listening = useRef(false)
  const interimRef = useRef('')
  interimRef.current = interim

  const supported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  const teardown = useCallback(() => {
    listening.current = false
    recognition.current?.stop()
    recognition.current = null
    if (media.current) {
      media.current.stream.getTracks().forEach(t => t.stop())
      void media.current.ctx.close().catch(() => undefined)
      media.current = null
    }
    setAnalyser(null)
  }, [])

  useEffect(() => teardown, [teardown])

  const start = useCallback(async () => {
    setError(null)
    setInterim('')
    finalText.current = ''
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      const ctx = new AudioContext()
      const node = ctx.createAnalyser()
      node.fftSize = 512
      ctx.createMediaStreamSource(stream).connect(node)
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : ''
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      const chunks: Blob[] = []
      recorder.ondataavailable = e => e.data.size && chunks.push(e.data)
      recorder.start(250)
      media.current = { stream, recorder, chunks, ctx }
      setAnalyser(node)

      if (!serverSTT) {
        const rec = getRecognition()
        if (rec) {
          rec.continuous = true
          rec.interimResults = true
          rec.lang = 'en-US'
          rec.onresult = e => {
            let live = ''
            for (let i = e.resultIndex; i < e.results.length; i++) {
              const r = e.results[i]
              if (r.isFinal) finalText.current = `${finalText.current} ${r[0].transcript}`.trim()
              else live += r[0].transcript
            }
            setInterim(`${finalText.current} ${live}`.trim())
          }
          rec.onerror = e => {
            if (e.error === 'not-allowed') setError('Microphone access was blocked.')
          }
          rec.onend = () => {
            if (listening.current) {
              try {
                rec.start()
              } catch {}
            }
          }
          listening.current = true
          rec.start()
          recognition.current = rec
        }
      }
      setState('recording')
    } catch {
      teardown()
      setError('Microphone unavailable. Check browser permissions, or type your answer.')
      setState('idle')
    }
  }, [serverSTT, teardown])

  const stop = useCallback(async (): Promise<{ text: string; audioUrl: string | null }> => {
    const m = media.current
    if (!m) return { text: '', audioUrl: null }
    listening.current = false
    recognition.current?.stop()
    const blob = await new Promise<Blob>(resolve => {
      m.recorder.onstop = () => resolve(new Blob(m.chunks, { type: m.recorder.mimeType || 'audio/webm' }))
      m.recorder.stop()
    })
    const browserText = (interimRef.current || finalText.current).trim()
    teardown()
    const audioUrl = blob.size > 0 ? URL.createObjectURL(blob) : null
    if (!serverSTT || blob.size === 0) {
      setState('idle')
      return { text: browserText, audioUrl }
    }
    setState('transcribing')
    try {
      const { text } = await api.transcribe(blob)
      return { text, audioUrl }
    } catch {
      setError("We couldn't transcribe that. You can type your answer instead.")
      return { text: browserText, audioUrl }
    } finally {
      setState('idle')
    }
  }, [serverSTT, teardown])

  const cancel = useCallback(() => {
    media.current?.recorder.stop()
    teardown()
    setInterim('')
    setState('idle')
  }, [teardown])

  return { state, interim, error, analyser, supported, start, stop, cancel }
}
