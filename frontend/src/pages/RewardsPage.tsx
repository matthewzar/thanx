import { PointsBalance } from '../features/points/components/PointsBalance'
import { RewardList } from '../features/rewards/components/RewardList'

export function RewardsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Rewards</h1>
        <PointsBalance />
      </div>
      <RewardList />
    </main>
  )
}
