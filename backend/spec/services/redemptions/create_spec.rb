require "rails_helper"

RSpec.describe Redemptions::Create do
  subject(:result) { described_class.call(user: user, reward_id: reward_id) }

  let(:user)      { create(:user, points_balance: 500) }
  let(:reward)    { create(:reward, cost: 200, stock: 10) }
  let(:reward_id) { reward.id }

  context "when all conditions are met" do
    it "returns a success result" do
      expect(result.success?).to be true
    end

    it "creates a Redemption row" do
      expect { result }.to change(Redemption, :count).by(1)
    end

    it "snapshots points_spent at the reward's cost at redemption time" do
      expect(result.redemption.points_spent).to eq(200)
    end

    it "decrements the user balance by the reward cost" do
      result
      expect(user.reload.points_balance).to eq(300)
    end

    it "decrements reward stock by one" do
      result
      expect(reward.reload.stock).to eq(9)
    end

    it "enqueues a RedemptionConfirmationJob" do
      expect { result }.to have_enqueued_job(RedemptionConfirmationJob)
    end
  end

  context "when stock is nil (unlimited)" do
    let(:reward) { create(:reward, cost: 100, stock: nil) }

    it "succeeds" do
      expect(result.success?).to be true
    end

    it "does not modify the stock column" do
      result
      expect(reward.reload.stock).to be_nil
    end
  end

  context "when balance exactly equals cost" do
    let(:user)   { create(:user, points_balance: 200) }
    let(:reward) { create(:reward, cost: 200) }

    it "succeeds" do
      expect(result.success?).to be true
    end

    it "leaves the user balance at zero" do
      result
      expect(user.reload.points_balance).to eq(0)
    end
  end

  context "when balance is insufficient" do
    let(:user) { create(:user, points_balance: 50) }

    it "returns a failure result" do
      expect(result.success?).to be false
    end

    it "reports an insufficient points error" do
      expect(result.errors).to include("Insufficient points")
    end

    it "does not create a Redemption" do
      expect { result }.not_to change(Redemption, :count)
    end

    it "does not change the user balance" do
      result
      expect(user.reload.points_balance).to eq(50)
    end
  end

  context "when reward is out of stock" do
    let(:reward) { create(:reward, cost: 100, stock: 0) }

    it "returns a failure result" do
      expect(result.success?).to be false
    end

    it "reports a reward unavailable error" do
      expect(result.errors).to include("Reward unavailable")
    end

    it "does not create a Redemption" do
      expect { result }.not_to change(Redemption, :count)
    end
  end

  context "when reward is inactive" do
    let(:reward) { create(:reward, cost: 100, active: false) }

    it "returns a failure result" do
      expect(result.success?).to be false
    end

    it "reports a reward unavailable error" do
      expect(result.errors).to include("Reward unavailable")
    end
  end

  context "when reward does not exist" do
    let(:reward_id) { 0 }

    it "returns a failure result" do
      expect(result.success?).to be false
    end
  end
end
