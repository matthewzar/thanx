class RewardSerializer
  include Alba::Resource

  attributes :id, :name, :description, :cost, :category, :stock, :active
  attribute(:available) { |r| r.available? }
end
