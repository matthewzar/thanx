class User < ApplicationRecord
  has_many :redemptions, dependent: :restrict_with_error

  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :points_balance, presence: true,
                              numericality: { greater_than_or_equal_to: 0 }
end
