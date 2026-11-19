// Provider-agnostic sync loop.
//
// A provider only has to implement these calls (see docs/sync/accounts-and-sync.md):
//   getSession()                    -> { userId } | null
//   push(userId, rows)              -> void
//   pull(userId, cursor)            -> { rows, cursor }
//   subscribe?(userId, onChange)    -> unsubscribe   (optional realtime nudge)
//
// The engine never blocks the UI: pages keep reading/writing localStorage and
// sync runs in the background when online, on a timer, and after local edits.

import {
  adoptExistingLocalData,
  applyRemoteChanges,
  getCursor,
  getPendingChanges,
  markPushed,
  onLocalDocChange,
  setCursor,
} from './localStore.js'

const DEBOUNCE_MS = 1500
const INTERVAL_MS = 60_000

export function createSyncEngine(provider, { onStatus = () => {} } = {}) {
  let userId = null
  let running = false
  let queued = false
  let debounceTimer = null
  let intervalTimer = null
  const cleanups = []

  const status = (state, detail) => onStatus({ state, detail, at: Date.now() })

  async function syncNow() {
    if (!userId) return
    if (running) {
      queued = true
      return
    }
    if (globalThis.navigator && globalThis.navigator.onLine === false) {
      status('offline')
      return
    }
    running = true
    status('syncing')
    try {
      const outgoing = getPendingChanges()
      if (outgoing.length) {
        await provider.push(userId, outgoing)
        markPushed(outgoing)
      }
      let cursor = getCursor()
      for (;;) {
        const page = await provider.pull(userId, cursor)
        applyRemoteChanges(page.rows)
        if (page.cursor === cursor || !page.rows.length) break
        cursor = page.cursor
        setCursor(cursor)
        if (!page.hasMore) break
      }
      status('synced')
    } catch (error) {
      status('error', error?.message || String(error))
    } finally {
      running = false
      if (queued) {
        queued = false
        scheduleSync()
      }
    }
  }

  function scheduleSync() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(syncNow, DEBOUNCE_MS)
  }

  async function start() {
    const session = await provider.getSession()
    if (!session?.userId) {
      status('signed-out')
      return false
    }
    userId = session.userId
    adoptExistingLocalData()

    cleanups.push(onLocalDocChange(({ source }) => {
      if (source === 'local') scheduleSync()
    }))
    if (provider.subscribe) cleanups.push(provider.subscribe(userId, scheduleSync))
    if (globalThis.addEventListener) {
      const onOnline = () => syncNow()
      globalThis.addEventListener('online', onOnline)
      cleanups.push(() => globalThis.removeEventListener('online', onOnline))
    }
    intervalTimer = setInterval(syncNow, INTERVAL_MS)
    await syncNow()
    return true
  }

  function stop() {
    clearTimeout(debounceTimer)
    clearInterval(intervalTimer)
    while (cleanups.length) cleanups.pop()()
    userId = null
  }

  return { start, stop, syncNow }
}
