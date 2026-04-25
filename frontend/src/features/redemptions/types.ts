import type { Reward } from '../rewards/types'

export interface Redemption {
  id: number
  points_spent: number
  created_at: string
  reward: Reward
}
