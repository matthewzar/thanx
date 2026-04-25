require "rails_helper"

RSpec.describe Reward, type: :model do
  it { is_expected.to have_many(:redemptions) }
  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_presence_of(:category) }
  it { is_expected.to validate_numericality_of(:cost).is_greater_than(0) }
  it { is_expected.to validate_numericality_of(:stock).is_greater_than_or_equal_to(0) }

  describe "#available?" do
    it "is true when active with positive stock" do
      expect(build(:reward, active: true, stock: 5)).to be_available
    end

    it "is true when active with nil stock" do
      expect(build(:reward, active: true, stock: nil)).to be_available
    end

    it "is false when stock is zero" do
      expect(build(:reward, active: true, stock: 0)).not_to be_available
    end

    it "is false when inactive" do
      expect(build(:reward, active: false, stock: 5)).not_to be_available
    end
  end

  describe ".affordable_for" do
    subject(:results) { described_class.affordable_for(user) }

    let(:user)    { create(:user, points_balance: 300) }
    let!(:cheap)  { create(:reward, cost: 100) }
    let!(:exact)  { create(:reward, cost: 300) }
    let!(:pricey) { create(:reward, cost: 400) }

    it { is_expected.to include(cheap, exact) }
    it { is_expected.not_to include(pricey) }
  end
end
