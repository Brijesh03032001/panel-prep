import type { AnswerEvent, AppConfig, SessionDoc, SessionSummary, Turn } from './types'

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((body as { error?: string }).error || `Request failed (${res.status})`)
  return body as T
}

const post = (url: string, body?: unknown) =>
  fetch(url, {
    method: 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

export type TurnResponse = { session: SessionDoc } & ({ turn: Turn } | { end: true })

export const api = {
  config: () => fetch('/api/config').then(r => json<AppConfig>(r)),
  createSession: (form: FormData) => fetch('/api/sessions', { method: 'POST', body: form }).then(r => json<{ session: SessionDoc }>(r)),
  getSession: (id: string) => fetch(`/api/sessions/${id}`).then(r => json<{ session: SessionDoc }>(r)),
  deleteSession: (id: string) => fetch(`/api/sessions/${id}`, { method: 'DELETE' }).then(r => json<{ ok: true }>(r)),
  deleteAll: () => fetch('/api/sessions', { method: 'DELETE' }).then(r => json<{ ok: true }>(r)),
  history: () => fetch('/api/sessions').then(r => json<{ sessions: SessionSummary[] }>(r)),
  buildPanel: (id: string) => post(`/api/sessions/${id}/panel`).then(r => json<{ session: SessionDoc }>(r)),
  startTurn: (id: string) => post(`/api/sessions/${id}/turn`).then(r => json<TurnResponse>(r)),
  moveOn: (id: string, turnId: string) => post(`/api/sessions/${id}/next`, { turnId }).then(r => json<TurnResponse>(r)),
  lifeline: (id: string, turnId: string) =>
    post(`/api/sessions/${id}/lifeline`, { turnId }).then(r => json<{ encouragement: string; hint: string; session: SessionDoc }>(r)),
  finish: (id: string) => post(`/api/sessions/${id}/finish`).then(r => json<{ session: SessionDoc }>(r)),
  rematch: (id: string, interviewerId: string) => post(`/api/sessions/${id}/rematch`, { interviewerId }).then(r => json<{ session: SessionDoc }>(r)),

  async answer(id: string, turnId: string, answer: string, onEvent: (e: AnswerEvent) => void) {
    const res = await post(`/api/sessions/${id}/answer`, { turnId, answer })
    if (!res.ok || !res.body) throw new Error(`Answer failed (${res.status})`)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let nl: number
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim()
        buffer = buffer.slice(nl + 1)
        if (line) onEvent(JSON.parse(line) as AnswerEvent)
      }
    }
  },

  async transcribe(blob: Blob) {
    const form = new FormData()
    form.append('audio', blob, 'answer.webm')
    return fetch('/api/transcribe', { method: 'POST', body: form }).then(r => json<{ text: string }>(r))
  },
}
