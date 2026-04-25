module Api
  module V1
    class RedemptionsController < ApplicationController
      def index
        redemptions = current_user.redemptions.includes(:reward).order(created_at: :desc)
        render json: RedemptionSerializer.new(redemptions).serializable_hash
      end

      def create
        result = Redemptions::Create.call(user: current_user, reward_id: redemption_params[:reward_id])

        if result.success?
          render json: RedemptionSerializer.new(result.redemption).serializable_hash, status: :created
        else
          render json: { errors: result.errors }, status: :unprocessable_entity
        end
      end

      private

      def redemption_params
        params.require(:redemption).permit(:reward_id)
      end
    end
  end
end
