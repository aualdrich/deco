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
describe 'scopes' do
  let!(:active_card)   { project.cards.create!(title: 'Active Card') }
  let!(:archived_card) { project.cards.create!(title: 'Archived Card', archived: true, archived_at: 1.hour.ago) }

  describe '.active' do
    it 'returns only non-archived cards' do
      expect(Card.active).to include(active_card)
      expect(Card.active).not_to include(archived_card)
    end
  end

  describe '.archived' do
    it 'returns only archived cards' do
      expect(Card.archived).to include(archived_card)
      expect(Card.archived).not_to include(active_card)
    end
  end
end

describe '#archive!' do
  let(:card) { project.cards.create!(title: 'To Archive') }

  it 'sets archived to true' do
    card.archive!
    expect(card.reload.archived).to be true
  end

  it 'sets archived_at to the current time' do
    freeze_time = Time.current
    allow(Time).to receive(:current).and_return(freeze_time)
    card.archive!
    expect(card.reload.archived_at).to be_within(2.seconds).of(freeze_time)
  end
end

describe '#restore!' do
  let(:card) { project.cards.create!(title: 'To Restore', archived: true, archived_at: 1.hour.ago) }

  it 'sets archived to false' do
    card.restore!
    expect(card.reload.archived).to be false
  end

  it 'clears archived_at' do
    card.restore!
    expect(card.reload.archived_at).to be_nil
  end
end

end