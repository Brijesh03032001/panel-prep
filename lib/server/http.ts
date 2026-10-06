import { NextResponse } from 'next/server'
import { RateLimitError } from './createai'
import { EngineError } from './engine'
import { ProviderUnavailableError } from './llm'
import { NotFoundError } from './repo'

export type RouteCtx = { params: Promise<{ id: string }> }

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong.'
}

export function errorResponse(err: unknown) {
  const status =
    err instanceof EngineError ? err.status
    : err instanceof NotFoundError ? 404
    : err instanceof ProviderUnavailableError ? 503
    : err instanceof RateLimitError ? 429
    : 500
  if (status === 500) console.error('[panel-prep]', err)
  return NextResponse.json({ error: status === 500 ? `The panel hit a snag: ${errorMessage(err)}` : errorMessage(err) }, { status })
}

// One request at a time per session, so a double-click can't evaluate the same answer twice.
const locks = new Map<string, Promise<unknown>>()

export async function withLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(id) ?? Promise.resolve()
  const run = prev.catch(() => undefined).then(fn)
  locks.set(id, run)
  try {
    return await run
  } finally {
    if (locks.get(id) === run) locks.delete(id)
  }
}
