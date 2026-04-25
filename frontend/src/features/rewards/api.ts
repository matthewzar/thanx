import { apiClient } from '../../lib/api-client'
import type { Reward } from './types'

export function fetchRewards(): Promise<Reward[]> {
  return apiClient.get<Reward[]>('/rewards')
}
