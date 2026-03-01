require 'rails_helper'

RSpec.describe "Projects", type: :request do
  describe "GET /projects/:id" do
    it "returns http success" do
      get "/projects/1"
      expect(response).to have_http_status(:success)
    end
  end
end
