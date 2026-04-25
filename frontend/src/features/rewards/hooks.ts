import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query-keys'
import { fetchRewards } from './api'

export function useRewards() {
  return useQuery({
    queryKey: queryKeys.rewards,
    queryFn: fetchRewards,
  })
}
