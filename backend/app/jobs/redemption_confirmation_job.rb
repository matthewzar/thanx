class RedemptionConfirmationJob < ApplicationJob
  queue_as :default

  def perform(_redemption_id)
    # Stub: notification logic goes here once a delivery channel is chosen.
  end
end
