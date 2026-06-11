import { describe, expect, it } from 'vitest'
import { memoryQueue, syncPending, type PendingBrew } from './offlineQueue.ts'

function entry(id: string): PendingBrew {
  return { id, payload: { method: 'espresso', dose_g: 18 }, queuedAt: '2026-06-11T08:00:00Z' }
}

describe('offlineQueue (spec offline-sync)', () => {
  it('encola, lista y elimina', async () => {
    const q = memoryQueue()
    await q.add(entry('a'))
    await q.add(entry('b'))
    expect(await q.all()).toHaveLength(2)
    await q.remove('a')
    expect((await q.all()).map((e) => e.id)).toEqual(['b'])
  })

  it('sync: el insert correcto sale de la cola', async () => {
    const q = memoryQueue()
    await q.add(entry('a'))
    const r = await syncPending(q, async () => ({ ok: true }))
    expect(r).toEqual({ synced: 1, failed: 0 })
    expect(await q.all()).toHaveLength(0)
  })

  it('sync: el duplicado de PK cuenta como sincronizado y sale de la cola', async () => {
    const q = memoryQueue()
    await q.add(entry('a'))
    const r = await syncPending(q, async () => ({ ok: false, duplicate: true }))
    expect(r).toEqual({ synced: 1, failed: 0 })
    expect(await q.all()).toHaveLength(0)
  })

  it('sync: el fallo de red mantiene la entrada en cola', async () => {
    const q = memoryQueue()
    await q.add(entry('a'))
    await q.add(entry('b'))
    const r = await syncPending(q, async (e) =>
      e.id === 'a' ? { ok: true } : { ok: false, duplicate: false },
    )
    expect(r).toEqual({ synced: 1, failed: 1 })
    expect((await q.all()).map((e) => e.id)).toEqual(['b'])
  })
})
