import { desc, eq } from 'drizzle-orm'
import { getDb, sessions } from './db'
import type { SessionDoc, SessionSummary } from '../types'

export class NotFoundError extends Error {}

export async function saveSession(doc: SessionDoc) {
  const db = await getDb()
  const row = {
    id: doc.id,
    createdAt: doc.createdAt,
    updatedAt: Date.now(),
    kind: doc.kind,
    mode: doc.mode,
    sample: doc.sample ? 1 : 0,
    status: doc.status,
    roleTitle: doc.setup.roleTitle,
    verdict: doc.outcome?.verdict.label ?? null,
    overall: doc.outcome?.verdict.overall ?? null,
    doc: JSON.stringify(doc),
  }
  await db.insert(sessions).values(row).onConflictDoUpdate({ target: sessions.id, set: row })
  return doc
}

export async function loadSession(id: string): Promise<SessionDoc> {
  const db = await getDb()
  const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1)
  if (!row) throw new NotFoundError(`Session ${id} not found`)
  return JSON.parse(row.doc) as SessionDoc
}

export async function deleteSession(id: string) {
  const db = await getDb()
  await db.delete(sessions).where(eq(sessions.id, id))
}

export async function deleteAllSessions() {
  const db = await getDb()
  await db.delete(sessions)
}

export async function listSessions(limit = 50): Promise<SessionSummary[]> {
  const db = await getDb()
  const rows = await db.select().from(sessions).orderBy(desc(sessions.createdAt)).limit(limit)
  return rows
    .filter(r => r.status === 'complete')
    .map(r => {
      const doc = JSON.parse(r.doc) as SessionDoc
      return {
        id: r.id,
        createdAt: r.createdAt,
        kind: doc.kind,
        mode: doc.mode,
        sample: doc.sample,
        roleTitle: r.roleTitle,
        verdict: (r.verdict as SessionSummary['verdict']) ?? null,
        overall: r.overall,
        domains: doc.panel.map(p => ({ domain: p.domain, confidence: p.confidence })),
      }
    })
}
