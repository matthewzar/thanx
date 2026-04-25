require "rails_helper"

RSpec.describe "Api::V1::Rewards", type: :request do
  let(:user) { create(:user) }

  describe "GET /api/v1/rewards" do
    before do
      create(:reward, name: "Cheap Coffee", cost:  50, active: true)
      create(:reward, name: "Pricey Cake",  cost: 300, active: true)
      create(:reward, :inactive, name: "Old Deal", cost: 100)
    end

    context "with a valid auth header" do
      before { get "/api/v1/rewards", headers: auth_headers(user) }

      it { expect(response).to have_http_status(:ok) }

      it "returns a bare array (not wrapped under a root key)" do
        expect(JSON.parse(response.body)).to be_an(Array)
      end

      it "includes active rewards" do
        names = JSON.parse(response.body).map { |r| r["name"] }
        expect(names).to include("Cheap Coffee", "Pricey Cake")
      end

      it "excludes inactive rewards" do
        names = JSON.parse(response.body).map { |r| r["name"] }
        expect(names).not_to include("Old Deal")
      end

      it "includes the available field on each reward" do
        expect(JSON.parse(response.body).first).to have_key("available")
      end

      it "returns rewards ordered by cost ascending" do
        costs = JSON.parse(response.body).map { |r| r["cost"] }
        expect(costs).to eq(costs.sort)
      end
    end

    context "without an auth header" do
      before { get "/api/v1/rewards" }

      it { expect(response).to have_http_status(:unauthorized) }
    end
  end
end
