// Local-first storage for learner data.
//
// Pages read and write whole documents exactly as before (readDoc / writeDoc),
// and localStorage stays the source the UI renders from, so the app keeps
// working fully offline. Alongside each document we keep a small sidecar of
// per-entry version stamps and a "pending" set; the sync engine uses that to
// push only what changed and to merge what other devices changed.

import { SYNCED_DOC_KEYS, getDocSpec, toEntries, fromEntries, sameValue } from './docs.js'
import { compareStamps } from './merge.js'

const META_KEY = 'simlit_sync_meta'
const DEVICE_KEY = 'simlit_device_id'

function storage() {
  return globalThis.localStorage
}

const listeners = new Set()

export function onLocalDocChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(docKey, source) {
  for (const listener of listeners) {
    try {
      listener({ docKey, source })
    } catch (error) {
      console.error('[sync] listener failed', error)
    }
  }
}

let clock = () => Date.now()
export function setClockForTests(fn) {
  clock = fn || (() => Date.now())
}

export function getDeviceId() {
  let id = storage().getItem(DEVICE_KEY)
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`
    storage().setItem(DEVICE_KEY, id)
  }
  return id
}

function readMeta() {
  try {
    const meta = JSON.parse(storage().getItem(META_KEY) || 'null')
    if (meta && typeof meta === 'object') return { docs: {}, cursor: null, ...meta }
  } catch {
    // fall through and rebuild
  }
  return { docs: {}, cursor: null }
}

function writeMeta(meta) {
  storage().setItem(META_KEY, JSON.stringify(meta))
}

function docMeta(meta, docKey) {
  if (!meta.docs[docKey]) meta.docs[docKey] = { stamps: {}, pending: [] }
  return meta.docs[docKey]
}

function addPending(dm, key) {
  if (!dm.pending.includes(key)) dm.pending.push(key)
}

export function readDoc(docKey, fallback = null) {
  try {
    const raw = storage().getItem(docKey)
    if (raw == null) return fallback
    const value = JSON.parse(raw)
    return value ?? fallback
  } catch {
    return fallback
  }
}

// Save a whole document. Entries that differ from what was stored get a new
// stamp and are queued for upload; entries that disappeared become tombstones.
export function writeDoc(docKey, value) {
  const spec = getDocSpec(docKey)
  const previous = readDoc(docKey, null)
  storage().setItem(docKey, JSON.stringify(value))
  if (!spec) return

  const before = toEntries(docKey, previous)
  const after = toEntries(docKey, value)
  const meta = readMeta()
  const dm = docMeta(meta, docKey)
  const deviceId = getDeviceId()
  const now = clock()
  let changed = false

  for (const key of Object.keys(after)) {
    if (!(key in before) || !sameValue(before[key], after[key]) || dm.stamps[key]?.deleted) {
      dm.stamps[key] = { updatedAt: now, deviceId }
      addPending(dm, key)
      changed = true
    }
  }
  for (const key of Object.keys(before)) {
    if (!(key in after)) {
      dm.stamps[key] = { updatedAt: now, deviceId, deleted: true }
      addPending(dm, key)
      changed = true
    }
  }
  if (changed) {
    writeMeta(meta)
    emit(docKey, 'local')
  }
}

// Everything waiting to be uploaded, as flat rows the backend can store as-is.
export function getPendingChanges() {
  const meta = readMeta()
  const changes = []
  for (const docKey of SYNCED_DOC_KEYS) {
    const dm = meta.docs[docKey]
    if (!dm?.pending?.length) continue
    const entries = toEntries(docKey, readDoc(docKey, null))
    for (const entryKey of dm.pending) {
      const stamp = dm.stamps[entryKey]
      if (!stamp) continue
      changes.push({
        docKey,
        entryKey,
        value: stamp.deleted ? null : entries[entryKey] ?? null,
        updatedAt: stamp.updatedAt,
        deviceId: stamp.deviceId,
        deleted: Boolean(stamp.deleted),
      })
    }
  }
  return changes
}

// Clear pending flags only for entries whose stamp has not moved since the
// push started, so an edit made mid-upload is not lost.
export function markPushed(changes) {
  const meta = readMeta()
  for (const change of changes) {
    const dm = meta.docs[change.docKey]
    if (!dm) continue
    const stamp = dm.stamps[change.entryKey]
    if (stamp && stamp.updatedAt === change.updatedAt && stamp.deviceId === change.deviceId) {
      dm.pending = dm.pending.filter((key) => key !== change.entryKey)
    }
  }
  writeMeta(meta)
}

// Fold rows from the server into local documents (newer stamp wins per entry).
export function applyRemoteChanges(rows) {
  if (!rows?.length) return []
  const meta = readMeta()
  const byDoc = new Map()
  for (const row of rows) {
    if (!getDocSpec(row.docKey)) continue
    if (!byDoc.has(row.docKey)) byDoc.set(row.docKey, [])
    byDoc.get(row.docKey).push(row)
  }

  const touchedDocs = []
  for (const [docKey, docRows] of byDoc) {
    const dm = docMeta(meta, docKey)
    const previous = readDoc(docKey, null)
    const entries = toEntries(docKey, previous)
    let changed = false
    for (const row of docRows) {
      const incoming = { updatedAt: row.updatedAt, deviceId: row.deviceId, deleted: Boolean(row.deleted) }
      if (compareStamps(incoming, dm.stamps[row.entryKey]) <= 0) continue
      dm.stamps[row.entryKey] = incoming
      dm.pending = dm.pending.filter((key) => key !== row.entryKey)
      if (row.deleted) delete entries[row.entryKey]
      else entries[row.entryKey] = row.value
      changed = true
    }
    if (changed) {
      storage().setItem(docKey, JSON.stringify(fromEntries(docKey, entries, previous)))
      touchedDocs.push(docKey)
    }
  }
  writeMeta(meta)
  for (const docKey of touchedDocs) emit(docKey, 'remote')
  return touchedDocs
}

export function getCursor() {
  return readMeta().cursor
}

export function setCursor(cursor) {
  const meta = readMeta()
  meta.cursor = cursor
  writeMeta(meta)
}

// First sign-in on a device that already has data: queue every existing
// entry that has never been stamped so it is uploaded rather than lost.
export function adoptExistingLocalData() {
  const meta = readMeta()
  const deviceId = getDeviceId()
  const now = clock()
  for (const docKey of SYNCED_DOC_KEYS) {
    const dm = docMeta(meta, docKey)
    for (const key of Object.keys(toEntries(docKey, readDoc(docKey, null)))) {
      if (!dm.stamps[key]) {
        dm.stamps[key] = { updatedAt: now, deviceId }
        addPending(dm, key)
      }
    }
  }
  writeMeta(meta)
}

export function hasPendingChanges() {
  const meta = readMeta()
  return Object.values(meta.docs).some((dm) => dm.pending?.length)
}

// Sign-out / reset: wipe every learner document and the sync sidecar.
// The device id is kept so the next account on this device stays distinguishable.
export function clearLocalData() {
  for (const docKey of SYNCED_DOC_KEYS) storage().removeItem(docKey)
  storage().removeItem(META_KEY)
  for (const docKey of SYNCED_DOC_KEYS) emit(docKey, 'clear')
}
