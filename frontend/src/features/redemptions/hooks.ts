import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '../../lib/api-client'
import { queryKeys } from '../../lib/query-keys'
import { createRedemption, fetchRedemptions } from './api'
import type { Redemption } from './types'

export function useRedemptions() {
  return useQuery({
    queryKey: queryKeys.redemptions,
    queryFn: fetchRedemptions,
  })
}

export function useRedeemReward() {
  const qc = useQueryClient()

  return useMutation<Redemption, Error, number>({
    mutationFn: (rewardId) => createRedemption(rewardId),

    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.user })
      void qc.invalidateQueries({ queryKey: queryKeys.rewards })
      void qc.invalidateQueries({ queryKey: queryKeys.redemptions })
      toast.success('Reward redeemed!')
    },

    onError: (error) => {
      // Surface the actual server phrase from Redemptions::Create::InvalidRedemption
      // (e.g. "Insufficient points", "Reward unavailable") rather than a generic
      // "Error". ApiError.message is already errors[0] from the Rails JSON body
      // {"errors": [...]}. Non-API errors (network, timeout) get a safe fallback.
      const message =
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again.'
      toast.error(message)
    },
  })
}
