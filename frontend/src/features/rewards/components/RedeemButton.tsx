import * as Tooltip from '@radix-ui/react-tooltip'
import { useState } from 'react'
import type { Reward } from '../types'
import { RedeemConfirmModal } from './RedeemConfirmModal'

interface RedeemButtonProps {
  reward: Reward
  userBalance: number
}

export function RedeemButton({ reward, userBalance }: RedeemButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const canAfford = userBalance >= reward.cost
  const isDisabled = !reward.available || !canAfford

  // Only show tooltip for the unaffordable case — the out-of-stock badge on the
  // card already communicates why that button is disabled.
  const tooltipText =
    !reward.available ? null : !canAfford
      ? `You need ${(reward.cost - userBalance).toLocaleString()} more pts`
      : null

  const button = (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => setIsModalOpen(true)}
      className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        isDisabled
          ? 'cursor-not-allowed bg-gray-100 text-gray-400'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      Redeem
    </button>
  )

  return (
    <>
      {tooltipText ? (
        <Tooltip.Root>
          {/* span wraps the disabled button because disabled elements eat pointer
              events and won't trigger the tooltip on hover */}
          <Tooltip.Trigger asChild>
            <span tabIndex={0} className="block">
              {button}
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="rounded bg-gray-900 px-2 py-1 text-xs text-white shadow"
              sideOffset={4}
            >
              {tooltipText}
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      ) : (
        button
      )}

      <RedeemConfirmModal
        reward={reward}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
