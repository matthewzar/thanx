require "rails_helper"

RSpec.describe User, type: :model do
  it { is_expected.to have_many(:redemptions).dependent(:restrict_with_error) }
  it { is_expected.to validate_presence_of(:email) }
  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_numericality_of(:points_balance).is_greater_than_or_equal_to(0) }

  describe "email uniqueness" do
    subject { create(:user) }

    it { is_expected.to validate_uniqueness_of(:email).case_insensitive }
  end

  it "allows zero balance" do
    expect(build(:user, points_balance: 0)).to be_valid
  end

  it "rejects negative balance" do
    expect(build(:user, points_balance: -1)).not_to be_valid
  end

  it "adds an error on points_balance when negative" do
    user = build(:user, points_balance: -1)
    user.valid?
    expect(user.errors[:points_balance]).to be_present
  end
end
