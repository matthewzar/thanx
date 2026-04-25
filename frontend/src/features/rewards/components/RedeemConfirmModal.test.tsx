import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { server } from '../../../test/server'
import { mockRedemption, mockRewards } from '../../../test/handlers'
import { RedeemConfirmModal } from './RedeemConfirmModal'

// Free Coffee: cost 200, available: true
const reward = mockRewards[0] as NonNullable<typeof mockRewards[0]>

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        {children}
        <Toaster />
      </QueryClientProvider>
    )
  }
}

describe('RedeemConfirmModal', () => {
  it('renders reward name and cost', () => {
    render(
      <RedeemConfirmModal reward={reward} isOpen={true} onClose={() => {}} />,
      { wrapper: makeWrapper() },
    )
    expect(screen.getByText('Redeem Free Coffee?')).toBeInTheDocument()
    expect(screen.getByText(/200 pts/)).toBeInTheDocument()
  })

  it('confirms redemption, shows success toast, and closes the modal', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    // Ensure the default POST handler is active (returns mockRedemption with 201)
    void mockRedemption

    render(
      <RedeemConfirmModal reward={reward} isOpen={true} onClose={onClose} />,
      { wrapper: makeWrapper() },
    )

    await user.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    await waitFor(() =>
      expect(screen.getByText('Reward redeemed!')).toBeInTheDocument(),
    )
  })

  it('surfaces the specific 422 error message inline — not a generic string', async () => {
    server.use(
      http.post('http://localhost:3000/api/v1/redemptions', () =>
        HttpResponse.json({ errors: ['Insufficient points'] }, { status: 422 }),
      ),
    )
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <RedeemConfirmModal reward={reward} isOpen={true} onClose={onClose} />,
      { wrapper: makeWrapper() },
    )

    await user.click(screen.getByRole('button', { name: /confirm/i }))

    // Inline error inside the modal — persistent, not just a toast
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Insufficient points')
    })

    // Modal stays open (title still visible)
    expect(screen.getByText('Redeem Free Coffee?')).toBeInTheDocument()

    // Confirm button is gone; only a single Close button remains
    expect(
      screen.queryByRole('button', { name: /^confirm$/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^close$/i })).toBeInTheDocument()

    // onClose was NOT called automatically
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes cleanly when the Close button is clicked after an error', async () => {
    server.use(
      http.post('http://localhost:3000/api/v1/redemptions', () =>
        HttpResponse.json({ errors: ['Insufficient points'] }, { status: 422 }),
      ),
    )
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <RedeemConfirmModal reward={reward} isOpen={true} onClose={onClose} />,
      { wrapper: makeWrapper() },
    )

    await user.click(screen.getByRole('button', { name: /confirm/i }))
    await waitFor(() => screen.getByRole('button', { name: /^close$/i }))
    await user.click(screen.getByRole('button', { name: /^close$/i }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})
