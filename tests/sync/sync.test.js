import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createFakeStorage } from './fakeStorage.js'
import {
  readDoc,
  writeDoc,
  getPendingChanges,
  clearLocalData,
  setClockForTests,
  hasPendingChanges,
} from '../../src/sync/localStore.js'
import { createSyncEngine } from '../../src/sync/syncEngine.js'
import { createMemoryBackend, createMemoryProvider } from '../../src/sync/providers/memoryProvider.js'

let now = 1_000
beforeEach(() => {
  now = 1_000
  setClockForTests(() => now)
})

function device(name) {
  const storage = createFakeStorage()
  storage.setItem('simlit_device_id', name)
  return storage
}

function on(storage, fn) {
  globalThis.localStorage = storage
  return fn()
}

async function syncDevice(storage, backend, userId = 'user-1') {
  globalThis.localStorage = storage
  const engine = createSyncEngine(createMemoryProvider(backend, userId))
  await engine.start()
  engine.stop()
}

test('writes stay readable offline and queue only changed entries', () => {
  const a = device('A')
  on(a, () => {
    writeDoc('simlit_profile', { name: 'Ada', age: 20 })
    assert.deepEqual(readDoc('simlit_profile'), { name: 'Ada', age: 20 })
    assert.equal(getPendingChanges().length, 2)
  })
})

test('a profile edited on one device appears on another', async () => {
  const backend = createMemoryBackend()
  const a = device('A')
  const b = device('B')
  on(a, () => writeDoc('simlit_profile', { name: 'Ada', hobbies: ['chess'] }))
  await syncDevice(a, backend)
  await syncDevice(b, backend)
  assert.deepEqual(on(b, () => readDoc('simlit_profile')), { name: 'Ada', hobbies: ['chess'] })
  assert.equal(on(a, () => hasPendingChanges()), false)
})

test('different notes edited on two devices both survive', async () => {
  const backend = createMemoryBackend()
  const a = device('A')
  const b = device('B')
  on(a, () => writeDoc('simlit_notes_list', [{ id: '1', title: 'Ohm', content: '' }]))
  await syncDevice(a, backend)
  await syncDevice(b, backend)

  now = 2_000
  on(a, () => writeDoc('simlit_notes_list', [{ id: '1', title: 'Ohm', content: 'V = IR' }]))
  now = 2_500
  on(b, () =>
    writeDoc('simlit_notes_list', [{ id: '2', title: 'Torts', content: 'duty' }, ...readDoc('simlit_notes_list')])
  )
  await syncDevice(a, backend)
  await syncDevice(b, backend)
  await syncDevice(a, backend)

  for (const storage of [a, b]) {
    const notes = on(storage, () => readDoc('simlit_notes_list'))
    assert.deepEqual(notes.map((n) => n.id).sort(), ['1', '2'])
    assert.equal(notes.find((n) => n.id === '1').content, 'V = IR')
  }
})

test('same entry edited on two devices: the later edit wins everywhere', async () => {
  const backend = createMemoryBackend()
  const a = device('A')
  const b = device('B')
  now = 2_000
  on(a, () => writeDoc('simlit_law_case_progress', { 'case-1': 40 }))
  now = 3_000
  on(b, () => writeDoc('simlit_law_case_progress', { 'case-1': 0 }))
  await syncDevice(b, backend)
  await syncDevice(a, backend)
  await syncDevice(b, backend)
  assert.deepEqual(on(a, () => readDoc('simlit_law_case_progress')), { 'case-1': 0 })
  assert.deepEqual(on(b, () => readDoc('simlit_law_case_progress')), { 'case-1': 0 })
})

test('a deleted note stays deleted after sync', async () => {
  const backend = createMemoryBackend()
  const a = device('A')
  const b = device('B')
  on(a, () => writeDoc('simlit_notes_list', [{ id: '1' }, { id: '2' }]))
  await syncDevice(a, backend)
  await syncDevice(b, backend)
  now = 2_000
  on(a, () => writeDoc('simlit_notes_list', [{ id: '2' }]))
  await syncDevice(a, backend)
  await syncDevice(b, backend)
  assert.deepEqual(on(b, () => readDoc('simlit_notes_list')), [{ id: '2' }])
})

test('data created before signing in is uploaded on first sync', async () => {
  const backend = createMemoryBackend()
  const a = device('A')
  // Simulate data written by the old app, straight to localStorage with no sidecar.
  a.setItem('simlit_health_case_progress', JSON.stringify({ 'p-1': 60 }))
  await syncDevice(a, backend)
  const b = device('B')
  await syncDevice(b, backend)
  assert.deepEqual(on(b, () => readDoc('simlit_health_case_progress')), { 'p-1': 60 })
})

test('accounts are isolated from each other', async () => {
  const backend = createMemoryBackend()
  const a = device('A')
  on(a, () => writeDoc('simlit_profile', { name: 'Ada' }))
  await syncDevice(a, backend, 'user-1')
  const b = device('B')
  await syncDevice(b, backend, 'user-2')
  assert.equal(on(b, () => readDoc('simlit_profile')), null)
})

test('sign-out clears every learner document, including attempt history', () => {
  const a = device('A')
  on(a, () => {
    writeDoc('simlit_profile', { name: 'Ada' })
    writeDoc('simlit_law_courtroom_attempts', { c: { attempts: 1 } })
    clearLocalData()
    assert.equal(readDoc('simlit_profile'), null)
    assert.equal(readDoc('simlit_law_courtroom_attempts'), null)
    assert.equal(hasPendingChanges(), false)
  })
})
