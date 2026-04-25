class Reward < ApplicationRecord
  has_many :redemptions

  validates :name, :category, presence: true
  validates :cost, presence: true, numericality: { greater_than: 0 }
  validates :stock, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :listed, -> { where(active: true) }
  scope :affordable_for, ->(user) { where("cost <= ?", user.points_balance) }

  def available?
    active? && (stock.nil? || stock > 0)
  end
end
