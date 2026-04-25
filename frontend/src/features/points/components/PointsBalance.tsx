import { useUser } from '../hooks'

export function PointsBalance() {
  const { data: user, isLoading } = useUser()

  if (isLoading) {
    return <div className="animate-pulse h-8 w-32 rounded-full bg-gray-200" />
  }

  if (!user) return null

  return (
    <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
      {user.points_balance.toLocaleString()} pts
    </div>
  )
}
