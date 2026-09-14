import type { Contact } from '@/data/contacts'

export interface AudienceDefinition {
  id: string
  name: string
  description: string
  /** Dynamic segment rule, evaluated at send time. Opt-in is enforced separately. */
  matches: (contact: Contact) => boolean
}

export const AUDIENCE_DEFINITIONS: AudienceDefinition[] = [
  {
    id: 'all',
    name: 'All subscribers',
    description: 'Everyone who opted in to marketing texts.',
    matches: () => true,
  },
  {
    id: 'vip',
    name: 'VIP members',
    description: 'Customers tagged as VIP.',
    matches: (contact) => contact.tags.includes('vip'),
  },
  {
    id: 'recent-buyers',
    name: 'Recent buyers',
    description: 'Placed an order in the last 30 days.',
    matches: (contact) => contact.lastPurchaseDaysAgo !== null && contact.lastPurchaseDaysAgo <= 30,
  },
  {
    id: 'abandoned-cart',
    name: 'Abandoned cart',
    description: 'Left items in their cart in the last 72 hours.',
    matches: (contact) =>
      contact.cartAbandonedHoursAgo !== null && contact.cartAbandonedHoursAgo <= 72,
  },
  {
    id: 'win-back',
    name: 'Win-back',
    description: 'Last order was more than 90 days ago.',
    matches: (contact) => contact.lastPurchaseDaysAgo !== null && contact.lastPurchaseDaysAgo > 90,
  },
]

/** Resolves an audience to real recipients: rule match, opted in, no duplicate numbers. */
export function resolveAudience(definition: AudienceDefinition, contacts: Contact[]): Contact[] {
  const seenPhones = new Set<string>()
  return contacts.filter((contact) => {
    if (!contact.optedIn || !definition.matches(contact) || seenPhones.has(contact.phone)) {
      return false
    }
    seenPhones.add(contact.phone)
    return true
  })
}
