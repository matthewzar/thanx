import * as Dialog from '@radix-ui/react-dialog'
import { useRedeemReward } from '../../redemptions/hooks'
import type { Reward } from '../types'

interface RedeemConfirmModalProps {
  reward: Reward
  isOpen: boolean
  onClose: () => void
}

export function RedeemConfirmModal({
  reward,
  isOpen,
  onClose,
}: RedeemConfirmModalProps) {
  // Called here, not in RedeemButton. Moving it to the button would create one
  // mutation instance per card — isPending and error state would be orphaned
  // when the modal closes. One modal mount = one mutation instance.
  const { mutate, isPending, error, isError, reset } = useRedeemReward()

  function handleClose() {
    reset()
    onClose()
  }

  function handleConfirm() {
    mutate(reward.id, { onSuccess: handleClose })
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isPending) handleClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl"
          onInteractOutside={(e) => {
            if (isPending) e.preventDefault()
          }}
        >
          <Dialog.Title className="pr-8 text-lg font-semibold text-gray-900">
            Redeem {reward.name}?
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-600">
            This will cost {reward.cost.toLocaleString()} pts from your balance.
          </Dialog.Description>

          {isError && error && (
            <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-red-700">
              <span aria-hidden="true">⚠</span>
              {error.message}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            {isError ? (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {isPending ? 'Confirming…' : 'Confirm'}
                </button>
              </>
            )}
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close dialog"
              disabled={isPending}
              className="absolute right-4 top-4 rounded p-1 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
            >
              ✕
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
