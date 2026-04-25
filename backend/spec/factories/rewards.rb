FactoryBot.define do
  factory :reward do
    name        { Faker::Commerce.product_name }
    description { Faker::Lorem.sentence }
    cost        { 100 }
    category    { "Coffee" }
    stock       { 10 }
    active      { true }

    trait :out_of_stock do
      stock { 0 }
    end

    trait :unlimited do
      stock { nil }
    end

    trait :inactive do
      active { false }
    end
  end
end
