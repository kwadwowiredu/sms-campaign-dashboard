import { validateCampaign } from '@/lib/validation'

const audience = { id: 'all', name: 'All subscribers', description: '', size: 1_000 }
const valid = {
  name: 'Christmas Mega Sale',
  audienceId: 'all',
  body: 'Our Christmas sale starts Friday. Reply STOP to opt out',
}
const plentyOfBalance = 100_000_000

describe('validateCampaign', () => {
  it('accepts a complete campaign the merchant can afford', () => {
    expect(validateCampaign(valid, { audience, availableBalanceMicros: plentyOfBalance })).toEqual({})
  })

  it('requires a name, an audience and a non-blank message', () => {
    const errors = validateCampaign(
      { name: '  ', audienceId: '', body: '   ' },
      { audience: undefined, availableBalanceMicros: plentyOfBalance },
    )
    expect(Object.keys(errors).sort()).toEqual(['audienceId', 'body', 'name'])
  })

  it('rejects messages over 640 characters', () => {
    const errors = validateCampaign(
      { ...valid, body: 'a'.repeat(641) },
      { audience, availableBalanceMicros: plentyOfBalance },
    )
    expect(errors.body).toMatch(/640/)
  })

  it('blocks a campaign that costs more than the balance', () => {
    // 1,000 recipients × 1 SMS × GH₵0.035 = GH₵35.00
    expect(validateCampaign(valid, { audience, availableBalanceMicros: 35_000_000 }).form).toBeUndefined()
    expect(validateCampaign(valid, { audience, availableBalanceMicros: 34_999_999 }).form).toMatch(
      /costs GH₵35\.00/,
    )
  })

  it('rejects an empty audience', () => {
    const errors = validateCampaign(valid, {
      audience: { ...audience, size: 0 },
      availableBalanceMicros: plentyOfBalance,
    })
    expect(errors.audienceId).toBeDefined()
  })
})
