class Step < ApplicationRecord
  belongs_to :card

  validates :title, presence: true

  default_scope { order(position: :asc) }
end
