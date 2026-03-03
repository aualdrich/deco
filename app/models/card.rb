class Card < ApplicationRecord
  belongs_to :project

  # Persisted planning chat history. Stored as JSON in a TEXT column (SQLite).
  # Use a proc default to avoid sharing a mutable Array across instances.
  attribute :chat_messages, :json, default: -> { [] }

  validates :title, presence: true
  validates :project_id, presence: true

  default_scope { order(position: :asc) }

  scope :active, -> { where(archived: false) }
  scope :archived, -> { where(archived: true) }

  def archive!
    update!(archived: true, archived_at: Time.current)
  end

  def restore!
    update!(archived: false, archived_at: nil)
  end
end
