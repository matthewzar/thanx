FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    name            { Faker::Name.name }
    points_balance  { 500 }
  end
end
