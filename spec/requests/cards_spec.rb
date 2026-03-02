require 'rails_helper'

RSpec.describe 'Cards', type: :request do
  let(:project) { Project.create!(name: 'Test Project') }

  describe 'GET /projects/:project_id/cards' do
    it 'returns 200 with an empty array when no cards exist' do
      get "/projects/#{project.id}/cards", as: :json

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq([])
    end

    it 'returns all cards for the project as JSON' do
      project.cards.create!(title: 'Card A', status: 'todo', position: 0)
      project.cards.create!(title: 'Card B', status: 'doing', position: 1)

      get "/projects/#{project.id}/cards", as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body.map { |c| c['title'] }).to include('Card A', 'Card B')
    end
  end

  describe 'POST /projects/:project_id/cards' do
    it 'creates a card and returns 201 with card JSON' do
      post "/projects/#{project.id}/cards",
        params: { card: { title: 'New Card', description: 'Some description', status: 'todo', position: 0 } },
        as: :json

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['id']).to be_present
      expect(body['title']).to eq('New Card')
      expect(body['description']).to eq('Some description')
      expect(body['status']).to eq('todo')
    end

    it 'returns 422 when title is missing' do
      post "/projects/#{project.id}/cards",
        params: { card: { title: nil } },
        as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body['errors']).to include("Title can't be blank")
    end
  end

  describe 'PATCH /projects/:project_id/cards/:id' do
    let(:card) { project.cards.create!(title: 'Moveable Card', status: 'todo', position: 0) }

    it 'updates status and position and returns 200' do
      patch "/projects/#{project.id}/cards/#{card.id}",
        params: { card: { status: 'doing', position: 2 } },
        as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['status']).to eq('doing')
      expect(body['position']).to eq(2)
    end
  end
describe 'GET /projects/:project_id/cards with ?status filter' do
  let!(:active_card)   { project.cards.create!(title: 'Active Card', status: 'todo') }
  let!(:archived_card) { project.cards.create!(title: 'Archived Card', status: 'todo', archived: true, archived_at: 1.hour.ago) }

  it 'returns only active cards by default' do
    get "/projects/#{project.id}/cards", as: :json
    body = JSON.parse(response.body)
    titles = body.map { |c| c['title'] }
    expect(titles).to include('Active Card')
    expect(titles).not_to include('Archived Card')
  end

  it 'returns only archived cards when ?status=archived' do
    get "/projects/#{project.id}/cards?status=archived", as: :json
    body = JSON.parse(response.body)
    titles = body.map { |c| c['title'] }
    expect(titles).to include('Archived Card')
    expect(titles).not_to include('Active Card')
  end
end

describe 'PATCH /projects/:project_id/cards/:id/archive' do
  let(:card) { project.cards.create!(title: 'Card to Archive', status: 'todo') }

  it 'archives the card and returns 200' do
    patch "/projects/#{project.id}/cards/#{card.id}/archive", as: :json
    expect(response).to have_http_status(:ok)
    expect(card.reload.archived).to be true
    expect(card.reload.archived_at).not_to be_nil
  end
end

describe 'PATCH /projects/:project_id/cards/:id/restore' do
  let(:card) { project.cards.create!(title: 'Card to Restore', status: 'doing', archived: true, archived_at: 1.hour.ago) }

  it 'restores the card to the todo column and returns 200' do
    patch "/projects/#{project.id}/cards/#{card.id}/restore", as: :json
    expect(response).to have_http_status(:ok)
    expect(card.reload.archived).to be false
    expect(card.reload.archived_at).to be_nil
    expect(card.reload.status).to eq('todo')
  end
end

end