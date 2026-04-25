class RedemptionSerializer
  include Alba::Resource

  attributes :id, :points_spent, :created_at
  one :reward, serializer: RewardSerializer
end
