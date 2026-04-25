import type { Reward } from '../types'
import { RedeemButton } from './RedeemButton'

interface RewardCardProps {
  reward: Reward
  userBalance: number
}

export function RewardCard({ reward, userBalance }: RewardCardProps) {
  return (
    <div
      className={`flex flex-col rounded-lg border bg-white p-6 shadow-sm transition-opacity${
        !reward.available ? ' opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900">{reward.name}</h3>
          {reward.description !== null && (
            <p className="mt-1 text-sm text-gray-600">{reward.description}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-lg font-bold text-indigo-600">
            {reward.cost.toLocaleString()} pts
          </span>
          {!reward.available && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              Out of stock
            </span>
          )}
        </div>
      </div>
      <div className="mt-3">
        <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
          {reward.category}
        </span>
      </div>
      <div className="mt-auto pt-4">
        <RedeemButton reward={reward} userBalance={userBalance} />
      </div>
    </div>
  )
}
