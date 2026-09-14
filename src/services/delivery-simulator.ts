import type { StatusUpdate } from '@/types'

type Listener = (updates: StatusUpdate[]) => void

const FAILURE_REASONS = [
  'Invalid number',
  'Carrier rejected: landline',
  'Unreachable handset',
  'Blocked by carrier spam filter',
]

interface SimulatorOptions {
  tickMs?: number
  failureRate?: number
  random?: () => number
}

/**
 * Stands in for carrier delivery receipts (normally a webhook to the backend,
 * pushed to the browser over a WebSocket). Tracked messages resolve to
 * Delivered or Failed after a random delay, in batches.
 */
export function createDeliverySimulator({
  tickMs = 1000,
  failureRate = 0.07,
  random = Math.random,
}: SimulatorOptions = {}) {
  const dueAtById = new Map<string, number>()
  const listeners = new Set<Listener>()
  let timer: ReturnType<typeof setInterval> | undefined

  function tick() {
    const now = Date.now()
    const updates: StatusUpdate[] = []

    for (const [id, dueAt] of dueAtById) {
      if (dueAt > now) continue
      dueAtById.delete(id)
      updates.push(
        random() < failureRate
          ? {
              id,
              status: 'Failed',
              statusDetail: FAILURE_REASONS[Math.floor(random() * FAILURE_REASONS.length)],
            }
          : { id, status: 'Delivered' },
      )
    }

    if (updates.length > 0) listeners.forEach((listener) => listener(updates))
    if (dueAtById.size === 0) {
      clearInterval(timer)
      timer = undefined
    }
  }

  return {
    track(ids: string[]) {
      const now = Date.now()
      for (const id of ids) {
        // Most receipts arrive within seconds; a few carriers are slow.
        const delay = random() < 0.05 ? 20_000 + random() * 25_000 : 1_500 + random() * 8_000
        dueAtById.set(id, now + delay)
      }
      timer ??= setInterval(tick, tickMs)
    },
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    reset() {
      clearInterval(timer)
      timer = undefined
      dueAtById.clear()
    },
  }
}
