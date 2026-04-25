import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../../test/server'
import { RewardList } from './RewardList'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe('RewardList', () => {
  it('shows a loading skeleton then renders all reward cards', async () => {
    render(<RewardList />, { wrapper: makeWrapper() })

    expect(screen.getByRole('status', { name: /loading rewards/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Free Coffee')).toBeInTheDocument()
    })
    expect(screen.getByText('Coffee Size Upgrade')).toBeInTheDocument()
    expect(screen.getByText('Free Lunch Sandwich')).toBeInTheDocument()
  })

  it('filters cards by search term', async () => {
    const user = userEvent.setup()
    render(<RewardList />, { wrapper: makeWrapper() })
    await waitFor(() => screen.getByText('Free Coffee'))

    await user.type(screen.getByRole('searchbox'), 'sandwich')

    expect(screen.queryByText('Free Coffee')).not.toBeInTheDocument()
    expect(screen.getByText('Free Lunch Sandwich')).toBeInTheDocument()
  })

  it('shows empty state when no rewards match the search', async () => {
    const user = userEvent.setup()
    render(<RewardList />, { wrapper: makeWrapper() })
    await waitFor(() => screen.getByText('Free Coffee'))

    await user.type(screen.getByRole('searchbox'), 'xyznotareward')

    expect(screen.getByText(/no rewards match/i)).toBeInTheDocument()
  })

  it('surfaces the server error message on API failure', async () => {
    server.use(
      http.get('http://localhost:3000/api/v1/rewards', () =>
        HttpResponse.json(
          { errors: ['Service temporarily unavailable'] },
          { status: 500 },
        ),
      ),
    )

    render(<RewardList />, { wrapper: makeWrapper() })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Service temporarily unavailable',
      )
    })
  })
})
