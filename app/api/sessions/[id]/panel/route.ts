import { NextResponse } from 'next/server'
import { buildPanel } from '@/lib/server/engine'
import { errorResponse, withLock, type RouteCtx } from '@/lib/server/http'
import { loadSession } from '@/lib/server/repo'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(_req: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const session = await withLock(id, async () => buildPanel(await loadSession(id)))
    return NextResponse.json({ session })
  } catch (err) {
    return errorResponse(err)
  }
}
