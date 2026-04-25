class Redemption < ApplicationRecord
  belongs_to :user
  belongs_to :reward

  validates :points_spent, presence: true, numericality: { greater_than: 0 }
end
