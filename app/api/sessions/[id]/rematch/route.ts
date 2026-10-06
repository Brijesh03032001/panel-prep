import { NextResponse } from 'next/server'
import { createRematch } from '@/lib/server/engine'
import { errorResponse, type RouteCtx } from '@/lib/server/http'
import { activeProvider, ProviderUnavailableError } from '@/lib/server/llm'
import { loadSession } from '@/lib/server/repo'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, { params }: RouteCtx) {
  try {
    const { id } = await params
    const { interviewerId } = (await req.json()) as { interviewerId: string }
    if (!activeProvider()) {
      throw new ProviderUnavailableError('A rematch is a fresh live conversation, so it needs an ASU CreateAI token (CREATEAI_API_KEY).')
    }
    const session = await createRematch(await loadSession(id), String(interviewerId))
    return NextResponse.json({ session })
  } catch (err) {
    return errorResponse(err)
  }
}
