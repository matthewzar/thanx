import { useMemo, useState } from 'react'
import { EmptyState } from '../../../components/EmptyState'
import { useRewards } from '../hooks'
import type { Reward } from '../types'
import { RewardCard } from './RewardCard'

type SortOption = 'cost-asc' | 'cost-desc' | 'name-asc'

function RewardCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-100" />
        </div>
        <div className="h-7 w-20 shrink-0 rounded bg-gray-200" />
      </div>
      <div className="mt-3 h-5 w-16 rounded bg-gray-100" />
    </div>
  )
}

function sortRewards(rewards: Reward[], sortBy: SortOption): Reward[] {
  return [...rewards].sort((a, b) => {
    if (sortBy === 'cost-asc') return a.cost - b.cost
    if (sortBy === 'cost-desc') return b.cost - a.cost
    return a.name.localeCompare(b.name)
  })
}

export function RewardList() {
  const { data: rewards, isLoading, error } = useRewards()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('cost-asc')
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = useMemo(
    () => [...new Set((rewards ?? []).map((r) => r.category))].sort(),
    [rewards],
  )

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    return (rewards ?? []).filter((r) => {
      const matchesSearch =
        term === '' ||
        r.name.toLowerCase().includes(term) ||
        (r.description?.toLowerCase().includes(term) ?? false)
      const matchesCategory =
        selectedCategory === '' || r.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [rewards, search, selectedCategory])

  const sorted = useMemo(() => sortRewards(filtered, sortBy), [filtered, sortBy])

  if (error) {
    return (
      <div role="alert" className="rounded-md bg-red-50 p-4 text-red-800">
        {error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search rewards…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search rewards"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          aria-label="Sort rewards"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="cost-asc">Cost: Low to High</option>
          <option value="cost-desc">Cost: High to Low</option>
          <option value="name-asc">Name: A–Z</option>
        </select>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-label="Loading rewards"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <RewardCardSkeleton key={i} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState message="No rewards match your search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((reward) => (
            <RewardCard key={reward.id} reward={reward} />
          ))}
        </div>
      )}
    </div>
  )
}
