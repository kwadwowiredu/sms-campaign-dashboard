import { useCallback, useEffect, useMemo, useReducer } from 'react'

import { availableBalanceMicros } from '@/lib/billing'
import { computeStats } from '@/lib/stats'
import * as api from '@/services/campaign-api'
import type { DashboardData, Message, NewCampaignInput, StatusUpdate } from '@/types'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; data: DashboardData }

type Action =
  | { type: 'loading' }
  | { type: 'loaded'; data: DashboardData }
  | { type: 'failed'; error: string }
  | { type: 'campaignSent'; messages: Message[] }
  | { type: 'statusesUpdated'; updates: StatusUpdate[] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loading':
      return { status: 'loading' }
    case 'loaded':
      return { status: 'ready', data: action.data }
    case 'failed':
      return { status: 'error', error: action.error }
    case 'campaignSent':
      if (state.status !== 'ready') return state
      return {
        ...state,
        data: { ...state.data, messages: [...action.messages, ...state.data.messages] },
      }
    case 'statusesUpdated': {
      if (state.status !== 'ready') return state
      const updatesById = new Map(action.updates.map((update) => [update.id, update]))
      const messages = state.data.messages.map((message) => {
        const update = updatesById.get(message.id)
        return update
          ? { ...message, status: update.status, statusDetail: update.statusDetail }
          : message
      })
      return { ...state, data: { ...state.data, messages } }
    }
  }
}

const NO_MESSAGES: Message[] = []

export function useDashboard() {
  const [state, dispatch] = useReducer(reducer, { status: 'loading' })
  const [loadCount, reload] = useReducer((count: number) => count + 1, 0)

  useEffect(() => {
    let cancelled = false
    dispatch({ type: 'loading' })
    api
      .fetchDashboard()
      .then((data) => !cancelled && dispatch({ type: 'loaded', data }))
      .catch(() => !cancelled && dispatch({ type: 'failed', error: 'Could not load campaign data.' }))
    return () => {
      cancelled = true
    }
  }, [loadCount])

  useEffect(
    () => api.subscribeToDeliveryReports((updates) => dispatch({ type: 'statusesUpdated', updates })),
    [],
  )

  const sendCampaign = useCallback(async (input: NewCampaignInput) => {
    const messages = await api.sendCampaign(input)
    dispatch({ type: 'campaignSent', messages })
    return messages
  }, [])

  const data = state.status === 'ready' ? state.data : undefined
  const messages = data?.messages ?? NO_MESSAGES
  const stats = useMemo(() => computeStats(messages), [messages])
  const balanceMicros = useMemo(
    () => (data ? availableBalanceMicros(data.account, messages) : 0),
    [data, messages],
  )

  return { state, data, messages, stats, balanceMicros, sendCampaign, reload }
}
