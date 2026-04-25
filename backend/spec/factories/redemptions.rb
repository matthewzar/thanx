FactoryBot.define do
  factory :redemption do
    association :user
    association :reward
    points_spent { 100 }
  end
end
