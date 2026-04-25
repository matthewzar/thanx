module Api
  module V1
    class RewardsController < ApplicationController
      def index
        rewards = Reward.listed.order(:cost)
        render json: RewardSerializer.new(rewards).serializable_hash
      end
    end
  end
end
