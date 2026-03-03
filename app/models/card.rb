class Card < ApplicationRecord
  belongs_to :project

  # Persisted planning chat history. Stored as JSON in a TEXT column (SQLite).
  # Use a proc default to avoid sharing a mutable Array across instances.
  attribute :chat_messages, :json, default: -> { [] }

  # NOTE: Status values are persisted and sent over the wire.
  # Use snake_case internal values to avoid hyphen/underscore mismatches.
  STATUSES = %w[
    todo
    planning
    ready_to_implement
    doing
    in_review
    done
  ].freeze

  before_validation :normalize_status

  validates :title, presence: true
  validates :project_id, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  default_scope { order(position: :asc) }

  scope :active, -> { where(archived: false) }
  scope :archived, -> { where(archived: true) }

  def archive!
    update!(archived: true, archived_at: Time.current)
  end

  def restore!
    update!(archived: false, archived_at: nil)
  end

  private

  def normalize_status
    # Back-compat: older clients used kebab-case (e.g. "in-review").
    self.status = status.to_s.tr("-", "_")
  end
end
