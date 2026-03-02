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
end
