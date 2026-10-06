import { NextResponse } from 'next/server'
import { moveOn, startTurn } from '@/lib/server/engine'
import { errorResponse, withLock, type RouteCtx } from '@/lib/server/http'
import { loadSession } from '@/lib/server/repo'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// "Move on" after a weak answer: close the turn without using the Lifeline, then fetch the next question.
export async function POST(req: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const { turnId } = (await req.json()) as { turnId: string }
    const body = await withLock(id, async () => {
      const session = await loadSession(id)
      await moveOn(session, String(turnId))
      const next = await startTurn(session)
      return 'end' in next ? { end: true, session } : { turn: next.turn, session }
    })
    return NextResponse.json(body)
  } catch (err) {
    return errorResponse(err)
  }
}
