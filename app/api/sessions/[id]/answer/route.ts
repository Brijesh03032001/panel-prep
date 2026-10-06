import { startTurn, submitAnswer } from '@/lib/server/engine'
import { errorMessage, withLock, type RouteCtx } from '@/lib/server/http'
import { loadSession } from '@/lib/server/repo'
import type { AnswerEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Streams NDJSON: the evaluation first (so the panel reacts immediately), then the next question.
export async function POST(req: Request, { params }: RouteCtx) {
  const { id } = await params
  const { turnId, answer } = (await req.json().catch(() => ({}))) as { turnId?: string; answer?: string }
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AnswerEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      try {
        await withLock(id, async () => {
          const session = await loadSession(id)
          const { result, decision } = await submitAnswer(session, String(turnId ?? ''), String(answer ?? ''))
          send({ type: 'result', turnId: String(turnId), result, session: structuredClone(session) })
          if (decision) return send({ type: 'decision', session })
          const next = await startTurn(session)
          send('end' in next ? { type: 'end', session } : { type: 'next', turn: next.turn, session })
        })
      } catch (err) {
        send({ type: 'error', message: errorMessage(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
