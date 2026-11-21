// Pure merge rules. No storage, no network: easy to test and to reuse on a server.
//
// Every entry carries a version stamp { updatedAt, deviceId }. The newer stamp
// wins (last writer wins per entry). Ties break on deviceId so every device
// reaches the same answer. Deletes are kept as tombstones so they win over
// stale copies of the same entry.

export function compareStamps(a, b) {
  if (!a && !b) return 0
  if (!a) return -1
  if (!b) return 1
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? 1 : -1
  const da = a.deviceId || ''
  const db = b.deviceId || ''
  if (da === db) return 0
  return da > db ? 1 : -1
}
