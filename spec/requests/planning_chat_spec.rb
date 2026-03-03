require "rails_helper"
require "net/http"

RSpec.describe "PlanningChat", type: :request do
  let(:project) { Project.create!(name: "Test Project") }
  let(:card) { project.cards.create!(title: "Chatty Card", status: "todo") }

  around do |example|
    original_token = ENV["OPENCLAW_GATEWAY_TOKEN"]
    original_url = ENV["OPENCLAW_GATEWAY_URL"]
    original_model = ENV["OPENCLAW_GATEWAY_MODEL"]

    ENV["OPENCLAW_GATEWAY_TOKEN"] = "test-token"
    ENV["OPENCLAW_GATEWAY_URL"] = "http://127.0.0.1:18790"
    ENV["OPENCLAW_GATEWAY_MODEL"] = "openclaw:deco"

    example.run
  ensure
    ENV["OPENCLAW_GATEWAY_TOKEN"] = original_token
    ENV["OPENCLAW_GATEWAY_URL"] = original_url
    ENV["OPENCLAW_GATEWAY_MODEL"] = original_model
  end

  describe "POST /projects/:project_id/cards/:id/planning_chat" do
    it "streams SSE back and persists user + assistant messages" do
      captured_req = nil

      http_double = double("Net::HTTP", :use_ssl= => nil, :read_timeout= => nil)
      response_double = double("Net::HTTPResponse")

      sse_chunks = [
        "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\n\n",
        "data: {\"choices\":[{\"delta\":{\"content\":\" world\"}}]}\n\n",
        "data: [DONE]\n\n"
      ]

      allow(response_double).to receive(:read_body).and_yield(sse_chunks[0]).and_yield(sse_chunks[1]).and_yield(sse_chunks[2])

      allow(http_double).to receive(:request) do |req, &blk|
        captured_req = req
        blk.call(response_double)
      end

      allow(Net::HTTP).to receive(:new).and_return(http_double)

      post "/projects/#{project.id}/cards/#{card.id}/planning_chat",
        params: { message: "User says hi" },
        as: :json

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("text/event-stream")

      # It should proxy the raw SSE chunks.
      expect(response.body).to include("data:")
      expect(response.body).to include("[DONE]")

      # It should authenticate to the gateway.
      expect(captured_req["Authorization"]).to eq("Bearer test-token")

      # It should inject the system prompt and include the user's message.
      body = JSON.parse(captured_req.body)
      expect(body["stream"]).to be true
      expect(body["model"]).to eq("openclaw:deco")
      roles = body["messages"].map { |m| m["role"] }
      expect(roles.first).to eq("system")
      expect(body["messages"].last["role"]).to eq("user")
      expect(body["messages"].last["content"]).to eq("User says hi")

      card.reload
      expect(card.chat_messages.map { |m| m["role"] }).to eq(["user", "assistant"])
      expect(card.chat_messages.last["content"]).to eq("Hello world")
    end

    it "returns 500 when token is missing" do
      ENV["OPENCLAW_GATEWAY_TOKEN"] = nil

      post "/projects/#{project.id}/cards/#{card.id}/planning_chat",
        params: { message: "Hi" },
        as: :json

      expect(response).to have_http_status(:internal_server_error)
      body = JSON.parse(response.body)
      expect(body["errors"].first).to match(/OPENCLAW_GATEWAY_TOKEN/)
    end
  end
end
