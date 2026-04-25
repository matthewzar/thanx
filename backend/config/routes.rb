Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resource  :user,        only: %i[show]
      resources :rewards,     only: %i[index]
      resources :redemptions, only: %i[create index]
    end
  end
end
