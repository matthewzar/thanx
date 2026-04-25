import { RedemptionHistory } from '../features/redemptions/components/RedemptionHistory'

export function RedemptionsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Redemption History</h1>
      <RedemptionHistory />
    </main>
  )
}
