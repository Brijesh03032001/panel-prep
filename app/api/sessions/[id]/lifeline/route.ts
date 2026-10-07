import { NextResponse } from 'next/server'
import { applyLifeline } from '@/lib/server/engine'
import { errorResponse, withLock, type RouteCtx } from '@/lib/server/http'
import { loadSession } from '@/lib/server/repo'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const { turnId } = (await req.json()) as { turnId: string }
    const body = await withLock(id, async () => {
      const session = await loadSession(id)
      const coaching = await applyLifeline(session, String(turnId))
      return { coaching, session }
    })
    return NextResponse.json(body)
  } catch (err) {
    return errorResponse(err)
  }
}
