import { AUDIENCE_DEFINITIONS, resolveAudience } from '@/data/audiences'
import { CONTACTS } from '@/data/contacts'
import seed from '@/data/seed.json'
import { availableBalanceMicros, messageCostMicros } from '@/lib/billing'
import { calculateSmsSegments } from '@/lib/sms'
import { hasErrors, validateCampaign, type CampaignErrors } from '@/lib/validation'
import { createDeliverySimulator } from '@/services/delivery-simulator'
import type {
  Account,
  Audience,
  Campaign,
  DashboardData,
  Message,
  MessageStatus,
  NewCampaignInput,
  StatusUpdate,
} from '@/types'

/**
 * In-memory mock of the backend. Components only talk to these exported
 * functions, so swapping in `fetch('/api/...')` later changes nothing else.
 */

const NETWORK_LATENCY_MS = 600

export class ApiError extends Error {
  readonly fieldErrors: CampaignErrors

  constructor(message: string, fieldErrors: CampaignErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.fieldErrors = fieldErrors
  }
}

interface Database {
  account: Account
  campaigns: Campaign[]
  messages: Message[]
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Segments and cost are always derived from the body, never trusted from stored data. */
function buildMessage(
  campaign: Campaign,
  recipient: { name: string; phone: string },
  fields: Pick<Message, 'id' | 'status' | 'statusDetail' | 'sentAt'>,
): Message {
  const segments = calculateSmsSegments(campaign.body)
  return {
    ...fields,
    campaignId: campaign.id,
    campaignName: campaign.name,
    recipientName: recipient.name,
    recipientPhone: recipient.phone,
    body: campaign.body,
    segments,
    costMicros: messageCostMicros(segments),
  }
}

function createDatabase(): Database {
  const campaigns: Campaign[] = structuredClone(seed.campaigns)
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]))

  const messages = seed.messages.map((row) => {
    const campaign = campaignsById.get(row.campaignId)
    if (!campaign) throw new Error(`Seed message ${row.id} references unknown campaign`)
    return buildMessage(
      campaign,
      { name: row.recipientName, phone: row.recipientPhone },
      {
        id: row.id,
        status: row.status as MessageStatus,
        statusDetail: row.statusDetail,
        sentAt: row.sentAt,
      },
    )
  })

  messages.sort((a, b) => b.sentAt.localeCompare(a.sentAt))
  return { account: structuredClone(seed.account), campaigns, messages }
}

const audiences: Audience[] = AUDIENCE_DEFINITIONS.map((definition) => ({
  id: definition.id,
  name: definition.name,
  description: definition.description,
  size: resolveAudience(definition, CONTACTS).length,
}))

let db = createDatabase()
const simulator = createDeliverySimulator()

// The "server" applies delivery receipts to its own records first.
simulator.subscribe((updates) => {
  const updatesById = new Map(updates.map((update) => [update.id, update]))
  db.messages = db.messages.map((message) => {
    const update = updatesById.get(message.id)
    return update ? { ...message, status: update.status, statusDetail: update.statusDetail } : message
  })
})

export async function fetchDashboard(): Promise<DashboardData> {
  await wait(NETWORK_LATENCY_MS)
  return structuredClone({ account: db.account, audiences, messages: db.messages })
}

export async function sendCampaign(input: NewCampaignInput): Promise<Message[]> {
  await wait(NETWORK_LATENCY_MS)

  const definition = AUDIENCE_DEFINITIONS.find((item) => item.id === input.audienceId)
  const audience = audiences.find((item) => item.id === input.audienceId)
  const errors = validateCampaign(input, {
    audience,
    availableBalanceMicros: availableBalanceMicros(db.account, db.messages),
  })
  if (!definition || hasErrors(errors)) {
    throw new ApiError('Campaign could not be sent.', errors)
  }

  const now = new Date().toISOString()
  const campaign: Campaign = {
    id: `cmp_${Date.now().toString(36)}`,
    name: input.name.trim(),
    body: input.body,
    audienceId: input.audienceId,
    createdAt: now,
  }

  const messages = resolveAudience(definition, CONTACTS).map((contact) =>
    buildMessage(campaign, contact, {
      id: `${campaign.id}_${contact.id}`,
      status: 'Pending',
      statusDetail: 'Queued with carrier',
      sentAt: now,
    }),
  )

  db.campaigns.push(campaign)
  db.messages = [...messages, ...db.messages]
  simulator.track(messages.map((message) => message.id))

  return structuredClone(messages)
}

export function subscribeToDeliveryReports(listener: (updates: StatusUpdate[]) => void) {
  return simulator.subscribe(listener)
}

/** Test helper: restore seed data and cancel pending receipts. */
export function resetMockApi() {
  simulator.reset()
  db = createDatabase()
}
