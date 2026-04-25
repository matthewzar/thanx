class UserSerializer
  include Alba::Resource

  attributes :id, :email, :name, :points_balance
end
