require 'rails_helper'

RSpec.describe Step, type: :model do
  let(:project) { Project.create!(name: 'Test Project') }
  let(:card) { project.cards.create!(title: 'Test Card') }

  describe 'associations' do
    it 'belongs to a card' do
      step = Step.new(title: 'Do the thing', card: card)
      expect(step.card).to eq(card)
    end
  end

  describe 'validations' do
    it 'is valid with a title and card' do
      step = Step.new(title: 'Do the thing', card: card)
      expect(step).to be_valid
    end

    it 'is invalid without a title' do
      step = Step.new(title: nil, card: card)
      expect(step).not_to be_valid
      expect(step.errors[:title]).to include("can't be blank")
    end

    it 'is invalid without a card' do
      step = Step.new(title: 'Orphan step')
      expect(step).not_to be_valid
    end
  end

  describe 'defaults' do
    it 'defaults completed to false' do
      step = card.steps.create!(title: 'A step')
      expect(step.completed).to be false
    end

    it 'defaults position to 0' do
      step = card.steps.create!(title: 'A step')
      expect(step.position).to eq(0)
    end
  end

  describe 'default ordering' do
    it 'orders steps by position ascending' do
      card.steps.create!(title: 'Third',  position: 3)
      card.steps.create!(title: 'First',  position: 1)
      card.steps.create!(title: 'Second', position: 2)

      expect(card.steps.map(&:title)).to eq(%w[First Second Third])
    end
  end
end
