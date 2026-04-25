import { EmptyState } from '../../../components/EmptyState'
import { useRedemptions } from '../hooks'
import { RedemptionRow } from './RedemptionRow'

function RedemptionRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-between rounded-lg border bg-white p-4">
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-gray-200" />
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>
      <div className="h-5 w-20 rounded bg-gray-200" />
    </div>
  )
}

export function RedemptionHistory() {
  const { data: redemptions, isLoading, error } = useRedemptions()

  if (error) {
    return (
      <div role="alert" className="rounded-md bg-red-50 p-4 text-red-800">
        {error.message}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading redemption history"
        className="space-y-3"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <RedemptionRowSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!redemptions || redemptions.length === 0) {
    return <EmptyState message="No redemption history yet." />
  }

  return (
    <div className="space-y-3">
      {redemptions.map((r) => (
        <RedemptionRow key={r.id} redemption={r} />
      ))}
    </div>
  )
}
