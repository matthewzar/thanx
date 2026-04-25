import * as Tooltip from '@radix-ui/react-tooltip'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { queryClient } from './lib/query-client'
import { RedemptionsPage } from './pages/RedemptionsPage'
import { RewardsPage } from './pages/RewardsPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider delayDuration={300}>
        <BrowserRouter>
          <nav className="border-b bg-white">
            <div className="mx-auto flex max-w-6xl gap-6 px-4 py-3">
              <Link
                to="/"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600"
              >
                Rewards
              </Link>
              <Link
                to="/redemptions"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600"
              >
                History
              </Link>
            </div>
          </nav>
          <Routes>
            <Route path="/" element={<RewardsPage />} />
            <Route path="/redemptions" element={<RedemptionsPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </Tooltip.Provider>
    </QueryClientProvider>
  )
}
