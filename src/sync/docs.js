// Registry of every piece of learner data SIMLIT keeps on the device.
// Each document is split into "entries" so two devices editing different
// parts of the same document (two notes, two case scores) never conflict.
//
//   record      -> one entry per top-level field   (profile)
//   collection  -> one entry per item, keyed by id  (notes list)
//   map         -> one entry per key                (case progress, attempts)

export const SYNCED_DOCS = {
  simlit_profile: { kind: 'record' },
  simlit_notes_list: { kind: 'collection', idField: 'id' },
  simlit_law_case_progress: { kind: 'map' },
  simlit_health_case_progress: { kind: 'map' },
  simlit_law_courtroom_attempts: { kind: 'map' },
  simlit_clinical_room_attempts: { kind: 'map' },
}

export const SYNCED_DOC_KEYS = Object.keys(SYNCED_DOCS)

export function getDocSpec(docKey) {
  return SYNCED_DOCS[docKey] || null
}

// Document value -> { entryKey: value }
export function toEntries(docKey, value) {
  const spec = getDocSpec(docKey)
  if (!spec || value == null) return {}
  if (spec.kind === 'collection') {
    if (!Array.isArray(value)) return {}
    const entries = {}
    for (const item of value) {
      const id = item?.[spec.idField]
      if (id != null) entries[String(id)] = item
    }
    return entries
  }
  if (typeof value !== 'object' || Array.isArray(value)) return {}
  return { ...value }
}

// { entryKey: value } -> document value.
// For collections, `previousValue` keeps the learner's existing order; items
// that arrive from another device are placed first (newest notes sit on top).
export function fromEntries(docKey, entries, previousValue) {
  const spec = getDocSpec(docKey)
  if (!spec) return null
  if (spec.kind === 'collection') {
    const previousIds = Array.isArray(previousValue)
      ? previousValue.map((item) => String(item?.[spec.idField]))
      : []
    const known = previousIds.filter((id) => id in entries)
    const incoming = Object.keys(entries).filter((id) => !previousIds.includes(id))
    return [...incoming, ...known].map((id) => entries[id])
  }
  return { ...entries }
}

export function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}
