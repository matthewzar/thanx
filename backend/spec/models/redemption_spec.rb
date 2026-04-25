require "rails_helper"

RSpec.describe Redemption, type: :model do
  it { is_expected.to belong_to(:user) }
  it { is_expected.to belong_to(:reward) }
  it { is_expected.to validate_presence_of(:points_spent) }
  it { is_expected.to validate_numericality_of(:points_spent).is_greater_than(0) }
end
