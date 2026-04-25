import type { Redemption } from '../types'

interface RedemptionRowProps {
  redemption: Redemption
}

export function RedemptionRow({ redemption }: RedemptionRowProps) {
  const date = new Date(redemption.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-4">
      <div>
        <p className="font-medium text-gray-900">{redemption.reward.name}</p>
        <p className="text-sm text-gray-500">{date}</p>
      </div>
      <span className="font-semibold text-indigo-600">
        −{redemption.points_spent.toLocaleString()} pts
      </span>
    </div>
  )
}
