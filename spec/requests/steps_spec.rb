require 'rails_helper'

RSpec.describe 'Steps', type: :request do
  let(:project) { Project.create!(name: 'Test Project') }
  let(:card) { project.cards.create!(title: 'Test Card') }

  describe 'POST /projects/:project_id/cards/:card_id/steps' do
    it 'creates a step and returns 201' do
      post "/projects/#{project.id}/cards/#{card.id}/steps",
        params: { step: { title: 'Write the test', position: 0 } },
        as: :json

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['title']).to eq('Write the test')
      expect(body['completed']).to be false
    end

    it 'returns 422 when title is missing' do
      post "/projects/#{project.id}/cards/#{card.id}/steps",
        params: { step: { title: nil } },
        as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)['errors']).to include("Title can't be blank")
    end
  end

  describe 'PATCH /projects/:project_id/cards/:card_id/steps/:id' do
    let(:step) { card.steps.create!(title: 'Incomplete step') }

    it 'updates completed and returns 200' do
      patch "/projects/#{project.id}/cards/#{card.id}/steps/#{step.id}",
        params: { step: { completed: true } },
        as: :json

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['completed']).to be true
    end
  end

  describe 'DELETE /projects/:project_id/cards/:card_id/steps/:id' do
    let(:step) { card.steps.create!(title: 'To be deleted') }

    it 'destroys the step and returns 204' do
      delete "/projects/#{project.id}/cards/#{card.id}/steps/#{step.id}",
        as: :json

      expect(response).to have_http_status(:no_content)
      expect(card.steps.find_by(id: step.id)).to be_nil
    end
  end
end
