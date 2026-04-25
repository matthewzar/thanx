import { apiClient } from '../../lib/api-client'
import type { Redemption } from './types'

export function fetchRedemptions(): Promise<Redemption[]> {
  return apiClient.get<Redemption[]>('/redemptions')
}

export function createRedemption(rewardId: number): Promise<Redemption> {
  return apiClient.post<Redemption>('/redemptions', {
    redemption: { reward_id: rewardId },
  })
}
