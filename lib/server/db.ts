import fs from 'node:fs'
import path from 'node:path'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  kind: text('kind').notNull(),
  mode: text('mode').notNull(),
  sample: integer('sample').notNull().default(0),
  status: text('status').notNull(),
  roleTitle: text('role_title').notNull(),
  verdict: text('verdict'),
  overall: integer('overall'),
  doc: text('doc').notNull(),
})

function resolveUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const dir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data')
  fs.mkdirSync(dir, { recursive: true })
  return `file:${path.join(dir, 'panelprep.db')}`
}

const globalForDb = globalThis as unknown as { ppClient?: Client; ppReady?: Promise<void> }

function client() {
  if (!globalForDb.ppClient) {
    globalForDb.ppClient = createClient({ url: resolveUrl(), authToken: process.env.DATABASE_AUTH_TOKEN })
  }
  return globalForDb.ppClient
}

export async function getDb() {
  const c = client()
  globalForDb.ppReady ??= c
    .batch([
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        kind TEXT NOT NULL,
        mode TEXT NOT NULL,
        sample INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        role_title TEXT NOT NULL,
        verdict TEXT,
        overall INTEGER,
        doc TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS sessions_created_at ON sessions (created_at)`,
    ])
    .then(() => undefined)
  await globalForDb.ppReady
  return drizzle(c)
}
