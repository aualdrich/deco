class Card < ApplicationRecord
  belongs_to :project

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
