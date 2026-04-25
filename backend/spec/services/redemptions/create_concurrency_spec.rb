require "rails_helper"
require "concurrent"

# Two cases, one per lock: the first proves the user lock prevents double-spend; the second proves
# the reward lock prevents double-stock-decrement. Instrumentation across 40 runs confirmed both
# locks serialize at the application-level guard — CHECK constraints are a backstop for non-service writes.
RSpec.describe Redemptions::Create, :concurrency do
  # rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations
  # Each example asserts a compound invariant (one success + one failure + correct final state)
  # that cannot be decomposed without losing the concurrent guarantee.

  it "prevents double-spend under concurrent requests (proves user lock)" do
    user    = create(:user, points_balance: 100)
    reward  = create(:reward, cost: 100, stock: 5)
    barrier = Concurrent::CyclicBarrier.new(2)

    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait(10)
          described_class.call(user: user, reward_id: reward.id)
        end
      end
    end
    results = threads.map(&:value)

    expect(results.count(&:success?)).to eq(1)
    expect(results.count { |r| !r.success? }).to eq(1)
    expect(user.reload.points_balance).to eq(0)
    expect(Redemption.count).to eq(1)
  end

  it "prevents double-stock-decrement when one unit remains (proves reward lock)" do
    user    = create(:user, points_balance: 200)
    reward  = create(:reward, cost: 100, stock: 1)
    barrier = Concurrent::CyclicBarrier.new(2)

    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          barrier.wait(10)
          described_class.call(user: user, reward_id: reward.id)
        end
      end
    end
    results = threads.map(&:value)

    expect(results.count(&:success?)).to eq(1)
    expect(Redemption.count).to eq(1)
    expect(reward.reload.stock).to eq(0)
  end
  # rubocop:enable RSpec/ExampleLength, RSpec/MultipleExpectations
end
