import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'
import { mockRewards } from '../../../test/handlers'
import { RedeemButton } from './RedeemButton'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <Tooltip.Provider>{children}</Tooltip.Provider>
      </QueryClientProvider>
    )
  }
}

// mockRewards[0]: Free Coffee, cost 200, available: true
// mockRewards[2]: Free Lunch Sandwich, cost 800, available: false

describe('RedeemButton', () => {
  it('does not open the modal when the user cannot afford the reward', async () => {
    const user = userEvent.setup()
    const reward = mockRewards[0] as NonNullable<typeof mockRewards[0]>
    render(<RedeemButton reward={reward} userBalance={50} />, {
      wrapper: makeWrapper(),
    })

    const button = screen.getByRole('button', { name: /redeem/i })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not open the modal when the reward is out of stock', async () => {
    const user = userEvent.setup()
    const reward = mockRewards[2] as NonNullable<typeof mockRewards[2]>
    render(<RedeemButton reward={reward} userBalance={5000} />, {
      wrapper: makeWrapper(),
    })

    const button = screen.getByRole('button', { name: /redeem/i })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
