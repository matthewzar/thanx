import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../../test/server'
import { mockRedemption } from '../../../test/handlers'
import { RedemptionHistory } from './RedemptionHistory'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('RedemptionHistory', () => {
  it('shows empty state when there is no redemption history', async () => {
    render(<RedemptionHistory />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect(screen.getByText(/no redemption history yet/i)).toBeInTheDocument()
    })
  })

  it('renders a row for each redemption when history exists', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/redemptions', () =>
        HttpResponse.json([mockRedemption]),
      ),
    )
    render(<RedemptionHistory />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect(screen.getByText('Free Coffee')).toBeInTheDocument()
    })
    expect(screen.getByText(/200 pts/)).toBeInTheDocument()
  })
})
