require "rails_helper"

RSpec.describe "Api::V1::Users", type: :request do
  let(:user) { create(:user, points_balance: 300) }

  describe "GET /api/v1/user" do
    context "with a valid auth header" do
      before { get "/api/v1/user", headers: auth_headers(user) }

      it { expect(response).to have_http_status(:ok) }

      it "returns a bare object (not wrapped under a root key)" do
        expect(JSON.parse(response.body)).to be_a(Hash)
      end

      it "includes the user id" do
        expect(JSON.parse(response.body)["id"]).to eq(user.id)
      end

      it "includes the points balance" do
        expect(JSON.parse(response.body)["points_balance"]).to eq(300)
      end
    end

    context "without an auth header" do
      before { get "/api/v1/user" }

      it { expect(response).to have_http_status(:unauthorized) }
    end
  end
end
