class Card < ApplicationRecord
  belongs_to :project
  has_many :steps, dependent: :destroy

  validates :title, presence: true
  validates :project_id, presence: true

  default_scope { order(position: :asc) }
end
