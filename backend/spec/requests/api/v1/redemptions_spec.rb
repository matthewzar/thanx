require "rails_helper"

RSpec.describe "Api::V1::Redemptions", type: :request do
  let(:user)   { create(:user, points_balance: 500) }
  let(:reward) { create(:reward, cost: 200, stock: 10) }

  describe "POST /api/v1/redemptions" do
    context "with valid params and sufficient balance" do
      before do
        post "/api/v1/redemptions",
             params: { redemption: { reward_id: reward.id } },
             headers: auth_headers(user)
      end

      it { expect(response).to have_http_status(:created) }

      it "returns the redemption with frozen points_spent" do
        expect(JSON.parse(response.body)["points_spent"]).to eq(200)
      end

      it "nests the reward inside the redemption" do
        expect(JSON.parse(response.body)["reward"]["id"]).to eq(reward.id)
      end

      it "returns a bare object (not wrapped under a root key)" do
        expect(JSON.parse(response.body)).to be_a(Hash)
      end
    end

    context "with insufficient balance" do
      before do
        post "/api/v1/redemptions",
             params: { redemption: { reward_id: reward.id } },
             headers: auth_headers(create(:user, points_balance: 10))
      end

      it { expect(response).to have_http_status(:unprocessable_entity) }

      it "returns the server error message under errors key" do
        expect(JSON.parse(response.body)["errors"]).to include("Insufficient points")
      end
    end

    context "with a nonexistent reward" do
      before do
        post "/api/v1/redemptions",
             params: { redemption: { reward_id: 0 } },
             headers: auth_headers(user)
      end

      it { expect(response).to have_http_status(:unprocessable_entity) }
    end

    context "without an auth header" do
      before { post "/api/v1/redemptions", params: { redemption: { reward_id: reward.id } } }

      it { expect(response).to have_http_status(:unauthorized) }
    end
  end

  describe "GET /api/v1/redemptions" do
    context "with an existing redemption history" do
      before do
        create(:redemption, user: user, reward: reward, points_spent: 200)
        create(:redemption, user: user, reward: create(:reward, cost: 50), points_spent: 50)
        get "/api/v1/redemptions", headers: auth_headers(user)
      end

      it { expect(response).to have_http_status(:ok) }

      it "returns a bare array" do
        expect(JSON.parse(response.body)).to be_an(Array)
      end

      it "returns redemptions newest first" do
        ids = JSON.parse(response.body).map { |r| r["id"] }
        expect(ids.first).to be > ids.last
      end

      it "returns the correct number of redemptions" do
        expect(JSON.parse(response.body).length).to eq(2)
      end
    end

    context "with no redemption history" do
      before { get "/api/v1/redemptions", headers: auth_headers(user) }

      it { expect(response).to have_http_status(:ok) }

      it "returns an empty array" do
        expect(JSON.parse(response.body)).to eq([])
      end
    end

    context "without an auth header" do
      before { get "/api/v1/redemptions" }

      it { expect(response).to have_http_status(:unauthorized) }
    end
  end
end
