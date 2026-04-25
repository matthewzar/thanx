module Redemptions
  class Create
    Error  = Class.new(StandardError)
    Result = Struct.new(:success?, :redemption, :errors, keyword_init: true)

    def self.call(**args) = new(**args).call

    def initialize(user:, reward_id:)
      @user      = user
      @reward_id = reward_id
    end

    def call
      redemption = ActiveRecord::Base.transaction do
        locked_user = User.lock.find(@user.id)      # acquire user row lock first
        reward      = Reward.lock.find(@reward_id)  # then reward row lock (consistent order prevents deadlock)

        # all checks happen after both locks are held — no stale reads
        raise Error, "Reward unavailable"  unless reward.available?
        raise Error, "Insufficient points" if locked_user.points_balance < reward.cost

        locked_user.update!(points_balance: locked_user.points_balance - reward.cost)
        reward.update!(stock: reward.stock - 1) unless reward.stock.nil?

        Redemption.create!(user: locked_user, reward: reward, points_spent: reward.cost)
      end

      RedemptionConfirmationJob.perform_later(redemption.id)
      success(redemption)
    rescue Error => e
      # Business rule violation (insufficient points or reward unavailable); transaction already rolled back.
      failure(e.message)
    rescue ActiveRecord::RecordNotFound => e
      # Reward or user deleted between request receipt and lock acquisition.
      failure(e.message)
    rescue ActiveRecord::RecordInvalid => e
      # Last-resort backstop: a DB-level constraint fired (e.g. points_balance >= 0 CHECK)
      # if application code was somehow bypassed.
      failure(e.full_messages.first)
    end

    private

    def success(r) = Result.new(success?: true,  redemption: r,   errors: [])
    def failure(m) = Result.new(success?: false, redemption: nil, errors: [ m ])
  end
end
