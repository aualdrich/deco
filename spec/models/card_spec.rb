require 'rails_helper'

RSpec.describe Card, type: :model do
  let(:project) { Project.create!(name: 'Test Project') }

  describe 'associations' do
    it 'belongs to a project' do
      card = Card.new(title: 'My Card', project: project)
      expect(card.project).to eq(project)
    end
  end

  describe 'validations' do
    it 'is valid with a title and project' do
      card = Card.new(title: 'Valid Card', project: project)
      expect(card).to be_valid
    end

    it 'is invalid without a title' do
      card = Card.new(title: nil, project: project)
      expect(card).not_to be_valid
      expect(card.errors[:title]).to include("can't be blank")
    end

    it 'is invalid without a project' do
      card = Card.new(title: 'Orphan Card')
      expect(card).not_to be_valid
    end
  end

  describe 'default ordering' do
    it 'orders cards by position ascending' do
      project.cards.create!(title: 'Third',  position: 3)
      project.cards.create!(title: 'First',  position: 1)
      project.cards.create!(title: 'Second', position: 2)

      titles = project.cards.map(&:title)
      expect(titles).to eq(%w[First Second Third])
    end
  end

  describe 'defaults' do
    it 'defaults status to todo' do
      card = project.cards.create!(title: 'Default Card')
      expect(card.status).to eq('todo')
    end

    it 'defaults position to 0' do
      card = project.cards.create!(title: 'Default Card')
      expect(card.position).to eq(0)
    end
  end
end
