import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the rewards page heading', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /rewards/i })).toBeInTheDocument()
    await waitFor(() => screen.getByText('Free Coffee'))
  })
})
