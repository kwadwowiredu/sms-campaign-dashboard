import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CampaignForm } from '@/components/dashboard/campaign-form'

function renderForm(onSend = vi.fn()) {
  render(<CampaignForm audiences={[]} balanceMicros={100_000_000} loading={false} onSend={onSend} />)
  return { onSend, user: userEvent.setup() }
}

describe('CampaignForm', () => {
  it('updates the character and SMS counter as you type', async () => {
    const { user } = renderForm()
    const message = screen.getByLabelText('Message')

    expect(screen.getByText('0/640 chars')).toBeInTheDocument()
    expect(screen.getByText('0 SMS')).toBeInTheDocument()

    await user.click(message)
    await user.paste('a'.repeat(160))
    expect(screen.getByText('160/640 chars')).toBeInTheDocument()
    expect(screen.getByText('1 SMS')).toBeInTheDocument()

    await user.type(message, 'b')
    expect(screen.getByText('161/640 chars')).toBeInTheDocument()
    expect(screen.getByText('2 SMS')).toBeInTheDocument()
    expect(screen.getByText('159 characters left in SMS 2.')).toBeInTheDocument()
  })

  it('shows validation errors instead of sending an incomplete campaign', async () => {
    const { user, onSend } = renderForm()

    await user.click(screen.getByRole('button', { name: /send campaign/i }))

    expect(screen.getByText('Give your campaign a name.')).toBeInTheDocument()
    expect(screen.getByText('Choose who should receive this campaign.')).toBeInTheDocument()
    expect(screen.getByText('Write a message to send.')).toBeInTheDocument()
    expect(onSend).not.toHaveBeenCalled()
  })
})
