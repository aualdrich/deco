class CardsController < ApplicationController
  before_action :set_project
  before_action :set_card, only: [:update, :archive, :restore, :chat_messages, :append_chat_messages]

  def index
    if params[:status] == "archived"
      @cards = @project.cards.archived
    else
      @cards = @project.cards.active
    end
    render json: @cards
  end

  def create
    @card = @project.cards.new(card_params)
    if @card.save
      render json: @card, status: :created
    else
      render json: { errors: @card.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @card.update(card_params)
      render json: @card
    else
      render json: { errors: @card.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def archive
    @card.archive!
    render json: @card
  end

  def restore
    @card.restore!
    @card.update!(status: "todo")
    render json: @card
  end

  # GET /projects/:project_id/cards/:id/chat_messages
  def chat_messages
    render json: { chat_messages: (@card.chat_messages || []) }
  end

  # POST /projects/:project_id/cards/:id/chat_messages
  # Body: { messages: [{ role: "user"|"assistant"|"system", content: "...", timestamp?: "ISO8601" }] }
  def append_chat_messages
    new_messages = normalize_chat_messages!(params[:messages])

    @card.with_lock do
      existing = Array(@card.chat_messages)

      # Idempotency: if the card already ends with the same role+content sequence,
      # don't append duplicates (e.g., when a proxy endpoint persisted as well).
      if existing.length >= new_messages.length
        existing_tail = existing.last(new_messages.length).map { |m| [m["role"].to_s, m["content"].to_s] }
        new_tail = new_messages.map { |m| [m["role"].to_s, m["content"].to_s] }
        if existing_tail == new_tail
          render json: @card and return
        end
      end

      @card.chat_messages = existing + new_messages
      @card.save!
    end

    render json: @card
  rescue ActionController::ParameterMissing, ArgumentError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  private

  def normalize_chat_messages!(messages_param)
    raise ActionController::ParameterMissing, :messages if messages_param.nil?

    unless messages_param.is_a?(Array)
      raise ArgumentError, "messages must be an array"
    end

    allowed_roles = %w[user assistant system]

    messages_param.map.with_index do |msg, idx|
      unless msg.is_a?(ActionController::Parameters) || msg.is_a?(Hash)
        raise ArgumentError, "messages[#{idx}] must be an object"
      end

      msg = msg.respond_to?(:to_unsafe_h) ? msg.to_unsafe_h : msg.to_h
      role = msg["role"]
      content = msg["content"]
      timestamp = msg["timestamp"]

      if role.blank? || !allowed_roles.include?(role)
        raise ArgumentError, "messages[#{idx}].role must be one of: #{allowed_roles.join(', ')}"
      end

      if content.blank?
        raise ArgumentError, "messages[#{idx}].content is required"
      end

      if timestamp.present?
        # Ensure it's parseable and normalized
        timestamp = Time.iso8601(timestamp.to_s).iso8601
      else
        timestamp = Time.current.iso8601
      end

      { "role" => role, "content" => content, "timestamp" => timestamp }
    end
  end

  def set_project
    @project = Project.find(params[:project_id])
  end

  def set_card
    @card = @project.cards.find(params[:id])
  end

  def card_params
    params.require(:card).permit(:title, :description, :status, :position)
  end
end
