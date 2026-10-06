import { NextResponse } from 'next/server'
import { errorResponse, type RouteCtx } from '@/lib/server/http'
import { deleteSession, loadSession } from '@/lib/server/repo'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    return NextResponse.json({ session: await loadSession(id) })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(_req: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    await deleteSession(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
