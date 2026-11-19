// In-memory backend used by tests and local demos. It behaves like the real
// server contract: rows are upserted by (userId, docKey, entryKey) only when
// the incoming stamp is newer, and every accepted write gets a sequence number
// that pull() pages through.

import { compareStamps } from '../merge.js'

export function createMemoryBackend() {
  const rows = new Map()
  let seq = 0

  return {
    rows,
    push(userId, changes) {
      for (const change of changes) {
        const id = `${userId}|${change.docKey}|${change.entryKey}`
        const existing = rows.get(id)
        if (existing && compareStamps(change, existing) <= 0) continue
        seq += 1
        rows.set(id, { ...change, userId, seq })
      }
    },
    pull(userId, cursor, limit = 500) {
      const after = cursor ?? 0
      const page = [...rows.values()]
        .filter((row) => row.userId === userId && row.seq > after)
        .sort((a, b) => a.seq - b.seq)
        .slice(0, limit)
      return {
        rows: page.map((row) => {
          const copy = { ...row }
          delete copy.userId
          delete copy.seq
          return copy
        }),
        cursor: page.length ? page[page.length - 1].seq : after,
        hasMore: page.length === limit,
      }
    },
  }
}

export function createMemoryProvider(backend, userId) {
  return {
    async getSession() {
      return userId ? { userId } : null
    },
    async push(uid, changes) {
      backend.push(uid, changes)
    },
    async pull(uid, cursor) {
      return backend.pull(uid, cursor)
    },
  }
}
