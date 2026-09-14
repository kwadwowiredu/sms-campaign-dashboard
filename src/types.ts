export const MESSAGE_STATUSES = ['Delivered', 'Pending', 'Failed'] as const
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]

/** Money is stored as integer micro-units (GH₵1 = 1,000,000) to avoid float drift. */
export type Micros = number

export interface Message {
  id: string
  campaignId: string
  campaignName: string
  recipientName: string
  /** E.164 format, e.g. +233241234567 */
  recipientPhone: string
  body: string
  segments: number
  /** Price of this message at send time. Whether it is billed depends on status. */
  costMicros: Micros
  status: MessageStatus
  /** Carrier detail, e.g. "Carrier rejected — landline". */
  statusDetail?: string
  sentAt: string
}

export interface Campaign {
  id: string
  name: string
  body: string
  audienceId: string
  createdAt: string
}

export interface Audience {
  id: string
  name: string
  description: string
  /** Opted-in contacts that match the audience rule right now. */
  size: number
}

export interface Account {
  merchantName: string
  /** Sum of all wallet top-ups. */
  creditMicros: Micros
}

export interface DashboardData {
  account: Account
  audiences: Audience[]
  messages: Message[]
}

export interface DashboardStats {
  totalSent: number
  delivered: number
  pending: number
  failed: number
  /** Delivered / total sent, 0–1. */
  deliveryRate: number
  billedSegments: number
  totalCostMicros: Micros
}

export interface NewCampaignInput {
  name: string
  audienceId: string
  body: string
}

export interface StatusUpdate {
  id: string
  status: MessageStatus
  statusDetail?: string
}
