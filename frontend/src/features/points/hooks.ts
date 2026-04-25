import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query-keys'
import { fetchUser } from './api'

export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: fetchUser,
  })
}
