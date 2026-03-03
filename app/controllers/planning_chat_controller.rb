# frozen_string_literal: true

require "net/http"
require "uri"
require "json"

class PlanningChatController < ApplicationController
  include ActionController::Live

  # This endpoint streams SSE via ActionController::Live which runs work in a separate thread.
  # Rails CSRF verification is not reliable in that scenario, so we skip it for this internal JSON API.
  skip_forgery_protection

  before_action :set_project
  before_action :set_card

  SYSTEM_PROMPT = <<~PROMPT
    You are a planning assistant helping define a feature for a kanban project management app.

    Guide the user through a structured planning interview covering:
    - problem statement
    - scope (in/out)
    - key user flows
    - technical considerations
    - success criteria

    Ask focused questions, 2-3 at a time.

    When you believe the plan is sufficiently detailed, output the final plan formatted in markdown, wrapped between <!-- PLAN_COMPLETE --> markers like this:

    <!-- PLAN_COMPLETE -->
    # Feature Plan: [Title]
    ## Problem & Users
    ...
    ## Scope
    ...
    ## Key User Flows
    ...
    ## Technical Notes
    ...
    ## Success Criteria
    ...
    <!-- /PLAN_COMPLETE -->

    Only output these markers when you are confident the plan is ready.
  PROMPT

  # POST /projects/:project_id/cards/:id/planning_chat
  # Body: { message: "user's message" }
  def create
    token = OpenclawGateway.token
    if token.blank?
      render json: { errors: ["OPENCLAW_GATEWAY_TOKEN is not configured"] }, status: :internal_server_error
      return
    end

    user_message = params.require(:message).to_s
    if user_message.blank?
      render json: { errors: ["message is required"] }, status: :unprocessable_entity
      return
    end

    # Persist the user's message before streaming.
    user_entry = {
      "role" => "user",
      "content" => user_message,
      "timestamp" => Time.current.iso8601
    }

    @card.with_lock do
      @card.chat_messages = Array(@card.chat_messages) + [user_entry]
      @card.save!
    end

    gateway_messages = build_gateway_messages(existing: @card.chat_messages, new_user_message: user_message)

    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"

    assistant_text = stream_from_gateway!(messages: gateway_messages, token: token)

    if assistant_text.present?
      assistant_entry = {
        "role" => "assistant",
        "content" => assistant_text,
        "timestamp" => Time.current.iso8601
      }

      @card.with_lock do
        @card.chat_messages = Array(@card.chat_messages) + [assistant_entry]
        @card.save!
      end
    end
  rescue ActionController::ParameterMissing => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  ensure
    response.stream.close
  end

  private

  def build_gateway_messages(existing:, new_user_message:)
    history = Array(existing).map do |m|
      {
        role: m["role"].to_s,
        content: m["content"].to_s
      }
    end

    # We already persisted the new user message into chat_messages. The API needs it as the final message.
    # Ensure we don't accidentally duplicate if history already includes it.
    if history.empty? || history.last[:role] != "user" || history.last[:content] != new_user_message
      history << { role: "user", content: new_user_message }
    end

    [{ role: "system", content: SYSTEM_PROMPT }] + history
  end

  def stream_from_gateway!(messages:, token:)
    assistant_text = +""

    uri = URI.join(OpenclawGateway.url, "/v1/chat/completions")

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == "https")
    http.read_timeout = 300

    req = Net::HTTP::Post.new(uri.request_uri)
    req["Content-Type"] = "application/json"
    req["Accept"] = "text/event-stream"
    req["Authorization"] = "Bearer #{token}"

    req.body = {
      model: OpenclawGateway.model,
      stream: true,
      messages: messages
    }.to_json

    sse_buffer = +""

    http.request(req) do |res|
      res.read_body do |chunk|
        response.stream.write(chunk)

        sse_buffer << chunk
        assistant_text << extract_assistant_text_from_sse!(sse_buffer)
      end
    end

    assistant_text
  end

  # Extract assistant delta text from complete SSE events.
  # Mutates buffer: removes processed events, keeps remainder.
  def extract_assistant_text_from_sse!(buffer)
    extracted = +""

    loop do
      # SSE events are separated by a blank line.
      sep_index = buffer.index("\n\n")
      break unless sep_index

      raw_event = buffer.slice!(0, sep_index + 2)
      data_lines = raw_event.lines.grep(/^data:\s*/)
      next if data_lines.empty?

      data_lines.each do |line|
        payload = line.sub(/^data:\s*/, "").strip
        next if payload.blank? || payload == "[DONE]"

        begin
          json = JSON.parse(payload)
          choice = json.fetch("choices").first || {}

          # OpenAI streaming shape: { choices: [{ delta: { content: "..." } }] }
          delta = choice["delta"] || {}
          extracted << delta["content"].to_s if delta["content"].present?

          # Some providers may send a final non-delta message.
          message = choice["message"] || {}
          extracted << message["content"].to_s if message["content"].present?
        rescue JSON::ParserError
          # Ignore malformed partial payloads.
        end
      end
    end

    extracted
  end

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_card
    @card = @project.cards.find(params[:id])
  end
end
