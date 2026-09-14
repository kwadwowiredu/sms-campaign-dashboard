import { countByStatus, filterMessages } from '@/lib/filter-messages'
import { makeMessage } from '@/test/factories'

const messages = [
  makeMessage({
    id: 'esi',
    recipientName: 'Esi Nyarko',
    recipientPhone: '+233244908132',
    campaignName: 'Back to School Sale',
    body: 'Back to school deals are here',
    status: 'Delivered',
  }),
  makeMessage({
    id: 'abdul',
    recipientName: 'Abdul-Rahman Issah',
    recipientPhone: '+233302771264',
    campaignName: 'Cart Reminder',
    body: 'Your cart is saved (24 hours)',
    status: 'Failed',
  }),
  makeMessage({
    id: 'dzifa',
    recipientName: 'Dzifa Amegashie',
    recipientPhone: '+233509241785',
    campaignName: 'Back to School Sale',
    body: 'Back to school deals are here',
    status: 'Pending',
  }),
]

const ids = (query: string, status: Parameters<typeof filterMessages>[1]['status'] = 'All') =>
  filterMessages(messages, { query, status }).map((message) => message.id)

describe('filterMessages', () => {
  it('returns everything for an empty or whitespace query', () => {
    expect(ids('')).toEqual(['esi', 'abdul', 'dzifa'])
    expect(ids('   ')).toEqual(['esi', 'abdul', 'dzifa'])
  })

  it('searches name, body and campaign case-insensitively', () => {
    expect(ids('ESI')).toEqual(['esi'])
    expect(ids('cart')).toEqual(['abdul'])
    expect(ids('school')).toEqual(['esi', 'dzifa'])
  })

  it('requires every word to match', () => {
    expect(ids('school dzifa')).toEqual(['dzifa'])
    expect(ids('school abdul')).toEqual([])
  })

  it('matches Ghanaian numbers in local or international form', () => {
    expect(ids('0244908132')).toEqual(['esi'])
    expect(ids('050 924')).toEqual(['dzifa'])
    expect(ids('+233 30 277')).toEqual(['abdul'])
    expect(ids('233509241785')).toEqual(['dzifa'])
    expect(ids('024 490 8132')).toEqual(['esi'])
    // Spaced groups must appear together: "050 277" is in no number, even though each group is.
    expect(ids('050 277')).toEqual([])
  })

  it('treats regex characters as plain text', () => {
    expect(ids('(24 hours)')).toEqual(['abdul'])
    expect(() => ids('[*')).not.toThrow()
  })

  it('combines search with a status filter', () => {
    expect(ids('school', 'Pending')).toEqual(['dzifa'])
    expect(ids('school', 'Failed')).toEqual([])
    expect(ids('', 'Delivered')).toEqual(['esi'])
  })
})

describe('countByStatus', () => {
  it('counts each status plus a total', () => {
    expect(countByStatus(messages)).toEqual({ All: 3, Delivered: 1, Pending: 1, Failed: 1 })
  })
})
