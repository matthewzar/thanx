import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PointsBalance } from './PointsBalance'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('PointsBalance', () => {
  it('renders the user points balance from the API', async () => {
    render(<PointsBalance />, { wrapper: makeWrapper() })
    await waitFor(() => {
      expect(screen.getByText(/pts/)).toBeInTheDocument()
    })
  })
})
