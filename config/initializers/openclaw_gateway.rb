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
    ENV.fetch("OPENCLAW_GATEWAY_TOKEN") do
      # Development convenience: allow running without exporting env vars.
      # Prefer a real env var (or .env via dotenv-rails) in all environments.
      if defined?(Rails) && Rails.env.development?
        "4388955c1c22266c98470afdc44d5c9d7b64d3d4f259fa43"
      end
    end
  end

  # Default to the deco agent.
  def model
    ENV.fetch("OPENCLAW_GATEWAY_MODEL", "openclaw:deco")
  end
end
