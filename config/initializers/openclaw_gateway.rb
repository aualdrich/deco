# frozen_string_literal: true

# Configuration for the local OpenClaw Gateway proxy.
#
# By default, OpenClaw Gateway runs locally on 127.0.0.1:18790.
# Auth is provided via a bearer token.
module OpenclawGateway
  module_function

  def url
    ENV.fetch("OPENCLAW_GATEWAY_URL", "http://127.0.0.1:18790")
  end

  def token
    ENV["OPENCLAW_GATEWAY_TOKEN"]
  end

  # Default to the deco agent.
  def model
    ENV.fetch("OPENCLAW_GATEWAY_MODEL", "openclaw:deco")
  end
end
