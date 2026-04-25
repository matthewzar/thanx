class ApplicationController < ActionController::API
  before_action :authenticate_user!

  private

  # Stub: resolves current_user from X-User-Id header.
  # Replace with real token authentication when auth is implemented.
  def authenticate_user!
    @current_user = User.find_by(id: request.headers["X-User-Id"])
    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
  end

  def current_user = @current_user
end
