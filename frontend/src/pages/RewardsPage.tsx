import { RewardList } from '../features/rewards/components/RewardList'

export function RewardsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Rewards</h1>
      <RewardList />
    </main>
  )
}
