# frozen_string_literal: true

# Configuration for the local OpenClaw Gateway proxy.
#
# By default, OpenClaw Gateway runs locally on 127.0.0.1:18790.
# Auth is provided via a bearer token stored in Rails credentials:
#
#   rails credentials:edit
#
#   openclaw:
#     gateway_url: http://127.0.0.1:18790
#     gateway_token: <your-token>
#     gateway_model: openclaw:deco
#
module OpenclawGateway
  module_function

  def url
    Rails.application.credentials.dig(:openclaw, :gateway_url) || "http://127.0.0.1:18790"
  end

  def token
    Rails.application.credentials.dig(:openclaw, :gateway_token)
  end

  def model
    Rails.application.credentials.dig(:openclaw, :gateway_model) || "openclaw:deco"
  end
end
